#!/bin/bash

# Script to deploy sample Kubernetes resources for Backstage monitoring
echo "Deploying sample Kubernetes resources..."

# Apply the sample deployment
kubectl apply -f k8s-examples/sample-app.yaml

echo "Resources deployed successfully!"
echo "You can now see them in Backstage under the 'my-k8s-app' component."

# Show the deployed resources
echo ""
echo "Deployed resources:"
kubectl get deployments,services,pods -l app=my-k8s-app