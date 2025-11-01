# KubeStage 🚀

> **A Self-Service Kubernetes Platform powered by Backstage**  
> *Democratizing Kubernetes through Golden Path Templates and Interactive UI Controls*

[![Backstage](https://img.shields.io/badge/Backstage-v1.44.0-blue)](https://backstage.io)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Integrated-326CE5)](https://kubernetes.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

## 📖 Overview

KubeStage is an Internal Developer Platform (IDP) built on top of Backstage that simplifies Kubernetes operations through:

- 🎯 **Golden Path Templates** - Pre-configured scaffolder templates for standardized K8s resource creation
- 🎨 **Interactive UI Controls** - Point-and-click buttons for common Kubernetes operations
- 🔗 **GitHub Integration** - Automatic repository creation and pull request workflows
- 🏷️ **Smart Labeling** - Automatic resource tagging with `backstage.io/kubernetes-id` for seamless tracking
- 📊 **Unified View** - Single pane of glass for all your Kubernetes resources

## ✨ Key Features

### 🎯 Golden Path Templates

Self-service templates that enforce best practices and organizational standards:

| Template | Description | Use Case |
|----------|-------------|----------|
| **Kubernetes Deployment** | Full-featured deployment with resource limits, health checks, and auto-scaling | Production workloads |
| **Kubernetes Service** | Service creation with ClusterIP, NodePort, LoadBalancer support | Expose applications |
| **Kubernetes Pod** | Standalone pod with GitHub integration | Quick deployments |
| **Simple Pod** | Direct pod creation without GitHub (testing) | Development/Testing |

### 🎨 Interactive UI Controls

Embedded action buttons in the Kubernetes tab for instant operations:

- **Create Deployment** - Launch deployments with custom configurations
- **Create Service** - Expose applications with various service types
- **Create Pod** - Spin up standalone pods for testing
- **Delete Resources** - Multi-select deletion with confirmation dialogs
- **Real-time Feedback** - Instant success/error notifications

### 🔧 Backend Kubernetes Actions

Custom Backstage actions for Kubernetes operations:

```typescript
// Available actions in router.ts
- POST /api/kubernetes-actions/execute
  - create-deployment: Creates deployment with automatic pod labeling
  - create-service: Exposes deployments as services
  - create-pod: Creates standalone pods
  - delete-resource: Deletes resources by type and name
```

### 🏷️ Smart Resource Labeling

Automatic labeling system ensures all resources are tracked:

```yaml
metadata:
  labels:
    backstage.io/kubernetes-id: cluster-viewer
spec:
  template:
    metadata:
      labels:
        backstage.io/kubernetes-id: cluster-viewer  # Auto-applied to pods
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Backstage Frontend                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Scaffolder      │  │ Kubernetes Tab   │  │  Catalog      │ │
│  │  Templates       │  │ Action Buttons   │  │  Entities     │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backstage Backend                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  Scaffolder      │  │ K8s Actions      │  │  Catalog      │ │
│  │  Actions         │  │ Router API       │  │  Processor    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Systems                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  GitHub          │  │ Kubernetes       │  │  Minikube     │ │
│  │  (Repos/PRs)     │  │ (kubectl)        │  │  Cluster      │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or v22
- **Yarn**: v4.4.1+
- **Kubernetes Cluster**: Minikube, Kind, or production cluster
- **kubectl**: Configured and authenticated
- **GitHub Token**: For repository operations (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YASHMAHAKAL/KubeStage.git
   cd KubeStage
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure Kubernetes connection**
   
   Update `app-config.yaml` with your cluster details:
   ```yaml
   kubernetes:
     serviceLocatorMethod:
       type: 'multiTenant'
     clusterLocatorMethods:
       - type: 'config'
         clusters:
           - name: 'minikube'
             url: 'https://192.168.49.2:8443'
             authProvider: 'serviceAccount'
             serviceAccountToken: ${KUBERNETES_SERVICE_ACCOUNT_TOKEN}
             caFile: '/path/to/ca.crt'
   ```

4. **Set up environment variables** (optional for GitHub integration)
   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   ```

5. **Start the application**
   ```bash
   yarn start
   ```

   This will start:
   - **Frontend**: http://localhost:3000
   - **Backend**: http://localhost:7007

## 📚 Usage Guide

### Creating Resources with Templates

1. Navigate to **Create** → **Choose a Template**
2. Select a Kubernetes template (Deployment, Service, Pod)
3. Fill in the configuration form:
   - **Name**: Resource name (must be DNS-compliant)
   - **Namespace**: Target Kubernetes namespace
   - **Image**: Container image (e.g., `nginx:latest`)
   - **Replicas**: Number of pod replicas (deployments only)
   - **Resources**: CPU/Memory requests and limits
4. Configure GitHub integration (optional):
   - **Repository**: Create new or select existing
   - **Pull Request**: Auto-create PR for review
5. Click **Create** to generate resources

### Using Action Buttons

1. Navigate to any component with Kubernetes resources
2. Click the **Kubernetes** tab
3. Use the action buttons:

   **Create Deployment**
   ```
   - Name: my-app
   - Image: nginx:latest
   - Replicas: 3
   - Port: 80
   - Namespace: default
   ```

   **Create Service**
   ```
   - Service Name: my-app-service
   - Target Deployment: my-app
   - Port: 80
   - Type: ClusterIP
   ```

   **Delete Resources**
   ```
   - Select resource type (deployment/service/pod)
   - Choose one or more resources
   - Confirm deletion
   ```

## 🗂️ Project Structure

```
kubestage/
├── packages/
│   ├── app/                                    # Frontend application
│   │   └── src/
│   │       └── components/
│   │           ├── KubernetesActions/          # UI action buttons
│   │           │   ├── KubernetesActionButtons.tsx
│   │           │   └── index.ts
│   │           └── catalog/
│   │               └── EntityPage.tsx          # Entity page with K8s tab
│   └── backend/                                # Backend services
│       └── src/
│           ├── index.ts                        # Backend entry point
│           └── plugins/
│               └── kubernetes-actions/         # Custom K8s actions
│                   ├── index.ts
│                   ├── router.ts               # API routes
│                   └── actions/
│                       ├── kubernetes-apply.ts
│                       ├── kubernetes-delete.ts
│                       └── kubernetes-pod.ts
├── templates/                                  # Scaffolder templates
│   ├── kubernetes-deployment/
│   │   ├── template.yaml                       # Template definition
│   │   └── content/                            # Template files
│   │       ├── catalog-info.yaml
│   │       ├── README.md
│   │       └── k8s/
│   │           └── deployment.yaml
│   ├── kubernetes-service/
│   ├── kubernetes-pod/
│   └── kubernetes-pod-simple/
├── examples/
│   └── entities.yaml                           # Example catalog entities
├── k8s-examples/
│   └── sample-app.yaml                         # Sample K8s manifests
├── app-config.yaml                             # Main configuration
├── app-config.local.yaml                       # Local overrides
└── package.json                                # Dependencies & scripts
```

## 🔧 Configuration

### Kubernetes Integration

```yaml
# app-config.yaml
kubernetes:
  serviceLocatorMethod:
    type: 'multiTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: 'minikube'
          url: 'https://192.168.49.2:8443'
          authProvider: 'serviceAccount'
          serviceAccountToken: ${KUBERNETES_SERVICE_ACCOUNT_TOKEN}
          caFile: '/path/to/ca.crt'
          skipMetricsLookup: true
```

### GitHub Integration

```yaml
# app-config.yaml
integrations:
  github:
    - host: github.com
      token: ${GITHUB_TOKEN}
      organization: YOUR_ORG_NAME
```

### Template Catalog

```yaml
# app-config.yaml
catalog:
  locations:
    - type: file
      target: /path/to/templates/kubernetes-deployment/template.yaml
      rules:
        - allow: [Template]
```

## 🎯 Key Innovations

### 1. Automatic Pod Labeling
When creating deployments through UI buttons, both the deployment AND its pods are automatically labeled:

```typescript
// Backend router automatically patches pod template
const patchArgs = [
  'patch', 'deployment', name,
  '-p', '{"spec":{"template":{"metadata":{"labels":{"backstage.io/kubernetes-id":"cluster-viewer"}}}}}',
  `--namespace=${namespace}`
];
```

### 2. Pull Request Workflow
Templates support pushing to existing repositories with automatic PR creation:

```yaml
- id: publish-pr
  name: Create Pull Request
  action: publish:github:pull-request
  input:
    repoUrl: ${{ parameters.repoUrl }}
    title: 'Add ${{ parameters.name }} Kubernetes deployment'
    branchName: feature/add-${{ parameters.name }}-deployment
```

### 3. Multi-Select Resource Deletion
UI supports selecting multiple resources of the same type for batch deletion:

```typescript
// Load available resources dynamically
const fetchResources = async () => {
  const response = await fetch(
    `/api/kubernetes-actions/resources?type=${resourceType}&namespace=${namespace}`
  );
  setAvailableResources(await response.json());
};
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
yarn test:all

# Run frontend tests
yarn workspace app test

# Run backend tests
yarn workspace backend test

# Run E2E tests
yarn test:e2e
```

### Manual Testing Checklist

- [ ] Create deployment via template
- [ ] Create service via template
- [ ] Create pod via UI button
- [ ] Verify labels are applied correctly
- [ ] Delete resources via UI
- [ ] Check GitHub PR creation
- [ ] Verify catalog registration

## 🐛 Troubleshooting

### Common Issues

**Issue**: Pods not showing in Backstage UI
```bash
# Solution: Verify label selector
kubectl get pods -l backstage.io/kubernetes-id=cluster-viewer
```

**Issue**: Backend cannot connect to Kubernetes
```bash
# Solution: Check service account token
kubectl get secret backstage-service-account-token -o jsonpath='{.data.token}' | base64 -d
```

**Issue**: GitHub integration not working
```bash
# Solution: Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here
```

## 🔒 Security Considerations

- **RBAC**: Use Kubernetes service accounts with minimal required permissions
- **Secrets**: Store sensitive data in environment variables or secret managers
- **Network**: Restrict backend API access to authorized users only
- **GitHub Token**: Use fine-grained personal access tokens with repo scope only

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Backstage Team** - For the amazing platform
- **Kubernetes Community** - For container orchestration
- **Material-UI** - For beautiful React components

## 📞 Contact

**Yash Mahakal**  
GitHub: [@YASHMAHAKAL](https://github.com/YASHMAHAKAL)  
Project: [KubeStage](https://github.com/YASHMAHAKAL/KubeStage)

---

<p align="center">
  Made with ❤️ for the Platform Engineering Community
  <br>
  <strong>From YAML Hell to Self-Service Heaven</strong>
</p>
