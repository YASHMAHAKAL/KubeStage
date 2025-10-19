#!/bin/bash

# Enable Backend Script for Backstage Kubernetes Integration
# This script ensures the backend is properly configured and started

echo "🚀 Enabling Backstage Backend with Kubernetes Integration"
echo "======================================================="
echo

# Function to check if a process is running
check_process() {
    if pgrep -f "$1" > /dev/null; then
        return 0  # Process is running
    else
        return 1  # Process is not running
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# Step 1: Stop any existing processes
echo "1. Stopping any existing Backstage processes..."
if check_process "backstage-cli"; then
    echo "  Stopping existing backstage processes..."
    pkill -f "backstage-cli" || true
    pkill -f "yarn start" || true
    pkill -f "npm start" || true
    sleep 3
fi
echo "✅ Existing processes stopped"
echo

# Step 2: Check project structure
echo "2. Verifying project structure..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in Backstage project directory"
    echo "Please run this script from your Backstage project root"
    exit 1
fi

# Check backend configuration
if [ ! -f "packages/backend/src/index.ts" ]; then
    echo "❌ Backend configuration not found"
    echo "Expected: packages/backend/src/index.ts"
    exit 1
fi

# Check if our custom modules exist
if [ ! -d "packages/backend/src/plugins/kubernetes-actions" ]; then
    echo "❌ Kubernetes actions backend module not found"
    echo "Expected: packages/backend/src/plugins/kubernetes-actions/"
    exit 1
fi

echo "✅ Project structure verified"
echo

# Step 3: Install dependencies
echo "3. Installing/updating dependencies..."
if [ -f "yarn.lock" ]; then
    echo "  Using Yarn..."
    yarn install
elif [ -f "package-lock.json" ]; then
    echo "  Using npm..."
    npm install
else
    echo "  Using npm (no lock file found)..."
    npm install
fi

if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo

# Step 4: Build backend
echo "4. Building backend..."
if [ -f "yarn.lock" ]; then
    yarn build:backend
else
    npm run build:backend
fi

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    echo "Check the build output above for errors"
    exit 1
fi
echo "✅ Backend built successfully"
echo

# Step 5: Check Kubernetes prerequisites
echo "5. Checking Kubernetes prerequisites..."

# Check if kubectl is available
if command -v kubectl > /dev/null 2>&1; then
    echo "✅ kubectl is available"
    kubectl version --client --short 2>/dev/null || echo "  kubectl client installed"
else
    echo "⚠️  kubectl not found - Kubernetes operations will fail"
    echo "  To install kubectl:"
    echo "    # On Ubuntu/Debian:"
    echo "    curl -LO https://dl.k8s.io/release/\$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    echo "    chmod +x kubectl && sudo mv kubectl /usr/local/bin/"
    echo "    # Or use your package manager:"
    echo "    sudo apt-get install -y kubectl"
fi

# Check if there's a Kubernetes cluster configured
if kubectl cluster-info > /dev/null 2>&1; then
    echo "✅ Kubernetes cluster is accessible"
    kubectl get nodes --no-headers 2>/dev/null | wc -l | xargs echo "  Nodes available:"
else
    echo "⚠️  No Kubernetes cluster configured"
    echo "  Kubernetes actions will fail without cluster access"
    echo "  To set up a local cluster, consider:"
    echo "    - minikube start"
    echo "    - kind create cluster"
    echo "    - docker desktop kubernetes"
fi
echo

# Step 6: Start backend
echo "6. Starting Backstage backend..."

# Create a log file for backend output
log_file="/tmp/backstage-backend.log"
echo "  Backend logs will be written to: $log_file"

# Start backend in background
if [ -f "yarn.lock" ]; then
    nohup yarn start > "$log_file" 2>&1 &
else
    nohup npm start > "$log_file" 2>&1 &
fi

backend_pid=$!
echo "  Backend started with PID: $backend_pid"
echo

# Step 7: Wait for services to be ready
echo "7. Waiting for services to start..."

# Wait for backend API
if wait_for_service "http://localhost:7007/health" "Backend API (port 7007)"; then
    echo "✅ Backend API is ready"
else
    echo "❌ Backend API failed to start"
    echo "  Check logs: tail -f $log_file"
    exit 1
fi

# Wait for frontend
if wait_for_service "http://localhost:3000" "Frontend (port 3000)"; then
    echo "✅ Frontend is ready"
else
    echo "⚠️  Frontend may still be starting - this can take a few more minutes"
fi

echo

# Step 8: Test our custom API endpoint
echo "8. Testing Kubernetes API endpoint..."

api_response=$(curl -s -w "%{http_code}" -X POST http://localhost:7007/api/kubernetes/execute \
    -H "Content-Type: application/json" \
    -d '{"action": "test", "parameters": {}}' 2>/dev/null)

http_code="${api_response: -3}"
response_body="${api_response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Kubernetes API endpoint is working"
    echo "  Response: $response_body"
elif [ "$http_code" = "404" ]; then
    echo "❌ API endpoint not found (404)"
    echo "  The backend module may not be properly registered"
    echo "  Check backend logs: tail -f $log_file"
elif [ "$http_code" = "000" ] || [ "$http_code" = "" ]; then
    echo "❌ Connection failed to API endpoint"
    echo "  Backend may not be fully started yet"
    echo "  Try testing again in a few minutes"
else
    echo "⚠️  API returned HTTP $http_code"
    echo "  Response: $response_body"
fi

echo

# Step 9: Test template registration
echo "9. Testing template registration..."

template_response=$(curl -s "http://localhost:7007/api/scaffolder/v2/templates" 2>/dev/null)
if echo "$template_response" | grep -q "kubernetes-deployment"; then
    echo "✅ Kubernetes deployment template is registered"
else
    echo "⚠️  Kubernetes deployment template not found"
fi

if echo "$template_response" | grep -q "kubernetes-service"; then
    echo "✅ Kubernetes service template is registered"
else
    echo "⚠️  Kubernetes service template not found"
fi

echo

# Step 10: Final status and instructions
echo "🏁 Backend Enablement Complete!"
echo "==============================="
echo
echo "Backend Status:"
echo "  PID: $backend_pid"
echo "  Logs: $log_file"
echo "  API: http://localhost:7007"
echo "  Frontend: http://localhost:3000"
echo
echo "To monitor backend:"
echo "  tail -f $log_file"
echo
echo "To stop backend:"
echo "  kill $backend_pid"
echo "  # or"
echo "  pkill -f backstage-cli"
echo
echo "Next steps:"
echo "1. Visit http://localhost:3000 to access Backstage"
echo "2. Navigate to 'Create' to see Kubernetes templates"
echo "3. View any entity page to see Kubernetes action buttons"
echo "4. Test the integration with: ./test-kubernetes-integration.sh"
echo

# Save PID for later cleanup
echo "$backend_pid" > /tmp/backstage-backend.pid
echo "Backend PID saved to /tmp/backstage-backend.pid"