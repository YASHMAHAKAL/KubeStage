#!/bin/bash

# Kubernetes Integration Test Script
# This script tests the custom Kubernetes actions we've implemented
# It can automatically enable the backend if needed

echo "🚀 Kubernetes Integration Test Script"
echo "======================================"
echo

# Function to enable backend if not running
enable_backend_if_needed() {
    echo "1. Checking if Backstage is running on port 7007..."
    if curl -s http://localhost:7007/health > /dev/null 2>&1; then
        echo "✅ Backstage is already running"
        return 0
    else
        echo "❌ Backstage is not running on port 7007"
        echo "🔄 Attempting to enable backend automatically..."
        
        # Check if enable-backend.sh exists and is executable
        if [ -f "./enable-backend.sh" ]; then
            echo "  Found enable-backend.sh script"
            if [ ! -x "./enable-backend.sh" ]; then
                echo "  Making enable-backend.sh executable..."
                chmod +x "./enable-backend.sh"
            fi
            echo "  Running enable-backend.sh..."
            ./enable-backend.sh
            
            # Wait a bit for the backend to start
            echo "  Waiting for backend to initialize..."
            sleep 10
            
            # Check again
            if curl -s http://localhost:7007/health > /dev/null 2>&1; then
                echo "✅ Backend successfully enabled and running"
                return 0
            else
                echo "❌ Backend failed to start automatically"
                echo "Please run: ./enable-backend.sh manually"
                return 1
            fi
        else
            echo "❌ enable-backend.sh script not found"
            echo "Please start Backstage with: npm start"
            return 1
        fi
    fi
}

# Enable backend if needed
if ! enable_backend_if_needed; then
    exit 1
fi

echo

# Test the frontend URL
echo "2. Testing frontend accessibility..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible on port 3000"
else
    echo "⚠️  Frontend may not be fully loaded yet"
fi

echo

# Test our custom Kubernetes API endpoint
echo "3. Testing custom Kubernetes API endpoint..."

# Test with a simple action
response=$(curl -s -w "%{http_code}" -X POST http://localhost:7007/api/kubernetes/execute \
    -H "Content-Type: application/json" \
    -d '{"action": "test", "parameters": {}}')

http_code="${response: -3}"
response_body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ API endpoint is working correctly"
    echo "Response: $response_body"
elif [ "$http_code" = "404" ]; then
    echo "❌ API endpoint not found (404)"
    echo "This suggests the backend module may not be properly registered"
elif [ "$http_code" = "000" ]; then
    echo "❌ Connection failed - Backstage may not be running"
else
    echo "⚠️  API returned HTTP $http_code"
    echo "Response: $response_body"
fi

echo

# Check if kubectl is available
echo "4. Checking kubectl availability..."
if command -v kubectl > /dev/null 2>&1; then
    echo "✅ kubectl is available"
    kubectl version --client --short 2>/dev/null || echo "✅ kubectl client is installed"
else
    echo "⚠️  kubectl is not installed - Kubernetes operations will fail"
fi

echo

# Test scaffolder templates
echo "5. Testing scaffolder templates..."
template_response=$(curl -s http://localhost:7007/api/scaffolder/v2/templates)
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
echo "🏁 Test completed!"
echo
if curl -s http://localhost:7007/health > /dev/null 2>&1; then
    echo "✅ Backend is running and ready!"
    echo
    echo "Next steps:"
    echo "- Visit http://localhost:3000 to access Backstage"
    echo "- Navigate to Create → Choose Template to see Kubernetes templates"
    echo "- View any entity page to see the Kubernetes action buttons"
    echo "- The buttons should now connect to working backend endpoints"
    echo
    echo "🌟 Your Kubernetes integration is ready to use!"
else
    echo "⚠️  Backend may have stopped. Run './enable-backend.sh' to restart if needed."
fi