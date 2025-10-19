import { Router } from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { spawn } from 'child_process';
import express from 'express';

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

export async function createKubernetesActionRouter(
  options: RouterOptions,
): Promise<Router> {
  const { logger } = options;
  const router = Router();
  
  // Middleware to parse JSON
  router.use(express.json());

  // Execute kubectl command helper
  const executeKubectl = (args: string[]): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((resolve, reject) => {
      const kubectl = spawn('kubectl', args);
      let stdout = '';
      let stderr = '';

      kubectl.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      kubectl.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      kubectl.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`kubectl command failed with code ${code}: ${stderr}`));
        }
      });
    });
  };

  // POST /execute - Execute kubectl commands
  router.post('/execute', async (req, res) => {
    try {
      const { action, parameters } = req.body;
      
      logger.info(`Executing Kubernetes action: ${action}`, parameters);

      let kubectlArgs: string[] = [];

      switch (action) {
        case 'create-deployment':
          const { name, image, replicas = '1', port = '80', namespace = 'default' } = parameters;
          kubectlArgs = [
            'create', 'deployment', name,
            `--image=${image}`,
            `--replicas=${replicas}`,
            `--port=${port}`,
            `--namespace=${namespace}`
          ];
          
          // After creating deployment, we'll add labels
          try {
            const { stdout } = await executeKubectl(kubectlArgs);
            logger.info(`Deployment created: ${stdout}`);
            
            // Add Backstage labels to the deployment
            const labelArgs = [
              'label', 'deployment', name,
              'backstage.io/kubernetes-id=cluster-viewer',
              `--namespace=${namespace}`
            ];
            const labelResult = await executeKubectl(labelArgs);
            logger.info(`Labels added: ${labelResult.stdout}`);
            
            res.json({
              success: true,
              message: `Deployment ${name} created and labeled successfully`,
              output: stdout + '\n' + labelResult.stdout,
              action: action,
              parameters: parameters
            });
            return;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to create deployment with labels: ${errorMessage}`);
            res.status(500).json({
              success: false,
              error: errorMessage,
              action: action,
              parameters: parameters
            });
            return;
          }

        case 'create-service':
          const { serviceName, targetApp, servicePort = '80', serviceType = 'ClusterIP', targetPort = '80', serviceNamespace = 'default' } = parameters;
          kubectlArgs = [
            'expose', 'deployment', targetApp,
            `--name=${serviceName}`,
            `--port=${servicePort}`,
            `--target-port=${targetPort}`,
            `--type=${serviceType}`,
            `--namespace=${serviceNamespace}`
          ];
          
          // After creating service, we'll add labels
          try {
            const { stdout } = await executeKubectl(kubectlArgs);
            logger.info(`Service created: ${stdout}`);
            
            // Add Backstage labels to the service
            const labelArgs = [
              'label', 'service', serviceName,
              'backstage.io/kubernetes-id=cluster-viewer',
              `--namespace=${serviceNamespace}`
            ];
            const labelResult = await executeKubectl(labelArgs);
            logger.info(`Labels added: ${labelResult.stdout}`);
            
            res.json({
              success: true,
              message: `Service ${serviceName} created and labeled successfully`,
              output: stdout + '\n' + labelResult.stdout,
              action: action,
              parameters: parameters
            });
            return;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Failed to create service with labels: ${errorMessage}`);
            res.status(500).json({
              success: false,
              error: errorMessage,
              action: action,
              parameters: parameters
            });
            return;
          }

        case 'create-pod':
          const { podName, podImage, podPort = '80', podNamespace = 'default' } = parameters;
          kubectlArgs = [
            'run', podName,
            `--image=${podImage}`,
            `--port=${podPort}`,
            `--namespace=${podNamespace}`,
            '--labels=backstage.io/kubernetes-id=cluster-viewer'
          ];
          break;

        case 'delete-resource':
          const { resourceType, resourceName, resourceNames, deleteNamespace = 'default' } = parameters;
          
          // Support both single resource (resourceName) and multiple resources (resourceNames)
          const resourcesToDelete = resourceNames && Array.isArray(resourceNames) ? resourceNames : [resourceName];
          
          // Filter out empty values
          const validResources = resourcesToDelete.filter(name => name && name.trim() !== '');
          
          if (validResources.length === 0) {
            return res.status(400).json({ 
              success: false, 
              error: 'No valid resource names provided',
              action: action,
              parameters: parameters
            });
          }

          kubectlArgs = [
            'delete', resourceType,
            ...validResources,
            `--namespace=${deleteNamespace}`
          ];
          break;

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      // Execute kubectl command for actions that use the break pattern (create-pod, delete-resource)
      const result = await executeKubectl(kubectlArgs);
      
      logger.info(`Kubernetes action ${action} completed successfully`);
      
      res.json({
        success: true,
        action,
        parameters,
        output: result.stdout,
        command: `kubectl ${kubectlArgs.join(' ')}`
      });

    } catch (error) {
      logger.error(`Kubernetes action failed: ${error}`);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        action: req.body.action,
        parameters: req.body.parameters
      });
    }
  });

  // GET /resources/:type - List available resources of a specific type
  router.get('/resources/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const { namespace = 'default' } = req.query;
      
      logger.info(`Listing Kubernetes resources: ${type} in namespace ${namespace}`);

      const result = await executeKubectl([
        'get', type,
        '--namespace', namespace as string,
        '--output', 'name'
      ]);

      const resources = result.stdout
        .split('\n')
        .filter(name => name.trim() !== '')
        .map(name => {
          // Extract just the resource name from format like "deployment.apps/my-app"
          const parts = name.trim().split('/');
          const resourceName = parts.length > 1 ? parts[1] : parts[0];
          return { name: resourceName, type };
        });

      res.json({
        success: true,
        resources,
        namespace
      });
    } catch (error: any) {
      logger.error(`Failed to list resources: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        type: req.params.type
      });
    }
  });

  // GET /health - Health check endpoint  
  router.get('/health', (_, res) => {
    res.json({ status: 'ok', service: 'kubernetes-actions' });
  });

  return router;
}