import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { spawn } from 'child_process';

/**
 * Creates an action that deletes Kubernetes resources using kubectl
 */
export const createKubernetesDeleteAction = () => {
  return createTemplateAction({
    id: 'kubernetes:delete',
    description: 'Deletes Kubernetes resources using kubectl',
    schema: {
      input: {
        type: 'object',
        required: ['resourceType', 'resourceName'],
        properties: {
          resourceType: {
            title: 'Resource Type',
            description: 'Type of Kubernetes resource (deployment, service, pod, etc.)',
            type: 'string',
          },
          resourceName: {
            title: 'Resource Name',
            description: 'Name of the resource to delete',
            type: 'string',
          },
          namespace: {
            title: 'Namespace',
            description: 'Kubernetes namespace',
            type: 'string',
            default: 'default',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          result: {
            title: 'Delete Result',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const { resourceType, resourceName, namespace } = ctx.input;

      ctx.logger.info(`Deleting ${resourceType}/${resourceName} in namespace ${namespace}`);

      return new Promise((resolve, reject) => {
        const args = ['delete', resourceType, resourceName];
        if (namespace) {
          args.push('-n', namespace);
        }

        const kubectl = spawn('kubectl', args, {
          cwd: ctx.workspacePath,
        });

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
            ctx.logger.info(`Successfully deleted ${resourceType}/${resourceName}: ${stdout}`);
            resolve({ result: stdout });
          } else {
            ctx.logger.error(`kubectl delete failed with code ${code}: ${stderr}`);
            reject(new Error(`kubectl delete failed: ${stderr}`));
          }
        });
      });
    },
  });
};