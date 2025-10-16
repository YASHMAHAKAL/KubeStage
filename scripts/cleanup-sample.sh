#!/bin/bash

# Script to clean up sample Kubernetes resources
echo "Cleaning up sample Kubernetes resources..."

# Delete the sample deployment
kubectl delete -f k8s-examples/sample-app.yaml

echo "Resources cleaned up successfully!"