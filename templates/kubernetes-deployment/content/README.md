# ${{ values.name }}

This is a Kubernetes deployment created using Backstage templates.

## Configuration

- **Application Name**: ${{ values.name }}
- **Namespace**: ${{ values.namespace }}
- **Container Image**: ${{ values.image }}
- **Container Port**: ${{ values.containerPort }}
- **Replicas**: ${{ values.replicas }}
- **Environment**: ${{ values.environment }}
- **Version**: ${{ values.version }}

## Resources

### CPU & Memory
- **CPU Request**: ${{ values.cpuRequest }}
- **Memory Request**: ${{ values.memoryRequest }}
- **CPU Limit**: ${{ values.cpuLimit }}
- **Memory Limit**: ${{ values.memoryLimit }}

## Deployment

To deploy this application to your Kubernetes cluster:

```bash
kubectl apply -f k8s/deployment.yaml
```

To check the deployment status:

```bash
kubectl get deployments -n ${{ values.namespace }}
kubectl get pods -n ${{ values.namespace }} -l app=${{ values.name }}
kubectl get services -n ${{ values.namespace }} -l app=${{ values.name }}
```

## Monitoring

This deployment is configured to be monitored by Backstage using the kubernetes plugin with the ID: `${{ values.backstageId }}`

## Health Checks

The deployment includes:
- **Liveness Probe**: Checks if the container is running
- **Readiness Probe**: Checks if the container is ready to serve traffic

Both probes use HTTP GET requests to the root path on port ${{ values.containerPort }}.