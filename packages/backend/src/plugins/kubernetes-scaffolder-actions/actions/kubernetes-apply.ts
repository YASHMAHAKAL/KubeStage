import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { spawn } from 'child_process';

export const createKubernetesApplyAction = () => {
  return createTemplateAction({
    id: 'kubernetes:apply',
    description: 'Apply Kubernetes manifests to a cluster',
    schema: {
      input: (z) => z.object({
        manifestPath: z.string({
          description: 'Path to the Kubernetes manifest file relative to the workspace'
        }).default('k8s/'),
        namespace: z.string({
          description: 'Kubernetes namespace to apply resources to'
        }).default('default'),
        kubeconfig: z.string({
          description: 'Path to kubeconfig file (optional)'
        }).optional(),
      }),
    },
    async handler(ctx) {
      const { manifestPath = 'k8s/', namespace = 'default', kubeconfig } = ctx.input;
      
      ctx.logger.info(`Applying Kubernetes manifests from ${manifestPath} to namespace ${namespace}`);
      
      try {
        const args = ['apply', '-f', manifestPath, '-n', namespace];
        
        if (kubeconfig) {
          args.unshift('--kubeconfig', kubeconfig);
        }
        
        const kubectlProcess = spawn('kubectl', args, {
          cwd: ctx.workspacePath,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        
        let stdout = '';
        let stderr = '';
        
        kubectlProcess.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        kubectlProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        await new Promise<void>((resolve, reject) => {
          kubectlProcess.on('close', (code) => {
            if (code === 0) {
              ctx.logger.info('Kubernetes manifests applied successfully');
              ctx.logger.info(stdout);
              resolve();
            } else {
              ctx.logger.error(`kubectl apply failed with code ${code}`);
              ctx.logger.error(stderr);
              reject(new Error(`kubectl apply failed: ${stderr}`));
            }
          });
          
          kubectlProcess.on('error', (error) => {
            ctx.logger.error(`Failed to execute kubectl: ${error.message}`);
            reject(error);
          });
        });
        
      } catch (error) {
        ctx.logger.error(`Error applying Kubernetes manifests: ${error}`);
        throw error;
      }
    },
  });
};