import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { spawn } from 'child_process';

/**
 * Creates an action that manages Kubernetes pods
 */
export const createKubernetesPodAction = () => {
  return createTemplateAction({
    id: 'kubernetes:pod',
    description: 'Manages Kubernetes pods (create, delete, restart)',
    schema: {
      input: {
        required: ['action', 'podName'],
        properties: {
          action: {
            title: 'Action',
            description: 'Action to perform on the pod',
            type: 'string',
            enum: ['create', 'delete', 'restart'],
          },
          podName: {
            title: 'Pod Name',
            description: 'Name of the pod',
            type: 'string',
          },
          image: {
            title: 'Container Image',
            description: 'Docker image to use (for create action)',
            type: 'string',
            default: 'nginx:latest',
          },
          namespace: {
            title: 'Namespace',
            description: 'Kubernetes namespace',
            type: 'string',
            default: 'default',
          },
          port: {
            title: 'Container Port',
            description: 'Port that the container exposes',
            type: 'integer',
            default: 80,
          },
        },
      },
      output: {
        properties: {
          result: {
            title: 'Pod Action Result',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const { action, podName, image, namespace, port } = ctx.input;

      ctx.logger.info(`Performing ${action} action on pod ${podName} in namespace ${namespace}`);

      return new Promise((resolve, reject) => {
        let args: string[] = [];

        switch (action) {
          case 'create':
            args = ['run', podName, `--image=${image}`, `--port=${port}`];
            if (namespace) {
              args.push('-n', namespace);
            }
            break;
          case 'delete':
            args = ['delete', 'pod', podName];
            if (namespace) {
              args.push('-n', namespace);
            }
            break;
          case 'restart':
            args = ['delete', 'pod', podName];
            if (namespace) {
              args.push('-n', namespace);
            }
            break;
          default:
            reject(new Error(`Unsupported action: ${action}`));
            return;
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
            ctx.logger.info(`Successfully performed ${action} on pod ${podName}: ${stdout}`);
            resolve({ result: stdout });
          } else {
            ctx.logger.error(`kubectl ${action} failed with code ${code}: ${stderr}`);
            reject(new Error(`kubectl ${action} failed: ${stderr}`));
          }
        });
      });
    },
  });
};