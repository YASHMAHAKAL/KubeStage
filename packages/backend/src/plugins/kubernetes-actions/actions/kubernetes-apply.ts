import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates an action that applies Kubernetes manifests using kubectl
 */
export const createKubernetesApplyAction = () => {
  return createTemplateAction<{
    manifestPath?: string;
    manifestContent?: string;
    namespace?: string;
    clusterName?: string;
  }>({
    id: 'kubernetes:apply',
    description: 'Applies Kubernetes manifests using kubectl',
    schema: {
      input: {
        type: 'object',
        properties: {
          manifestPath: {
            title: 'Manifest Path',
            description: 'Path to the Kubernetes manifest file',
            type: 'string',
          },
          manifestContent: {
            title: 'Manifest Content',
            description: 'Direct YAML content to apply',
            type: 'string',
          },
          namespace: {
            title: 'Namespace',
            description: 'Kubernetes namespace to apply to',
            type: 'string',
            default: 'default',
          },
          clusterName: {
            title: 'Cluster Name',
            description: 'Name of the Kubernetes cluster',
            type: 'string',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          result: {
            title: 'Apply Result',
            type: 'string',
          },
          resources: {
            title: 'Created Resources',
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    async handler(ctx) {
      const { manifestPath, manifestContent, namespace, clusterName } = ctx.input;

      if (!manifestPath && !manifestContent) {
        throw new Error('Either manifestPath or manifestContent must be provided');
      }

      let filePath: string;

      if (manifestContent) {
        // Create temporary file for manifest content
        const tempDir = path.join(ctx.workspacePath, '.tmp');
        await fs.promises.mkdir(tempDir, { recursive: true });
        filePath = path.join(tempDir, 'manifest.yaml');
        await fs.promises.writeFile(filePath, manifestContent);
      } else if (manifestPath) {
        filePath = path.resolve(ctx.workspacePath, manifestPath);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Manifest file not found: ${filePath}`);
        }
      } else {
        throw new Error('No manifest provided');
      }

      ctx.logger.info(`Applying Kubernetes manifest: ${filePath}`);

      return new Promise((resolve, reject) => {
        const args = ['apply', '-f', filePath];
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
            const resources = stdout
              .split('\\n')
              .filter(line => line.trim())
              .map(line => line.trim());

            ctx.logger.info(`Successfully applied Kubernetes resources: ${stdout}`);
            
            resolve({
              result: stdout,
              resources: resources,
            });
          } else {
            ctx.logger.error(`kubectl apply failed with code ${code}: ${stderr}`);
            reject(new Error(`kubectl apply failed: ${stderr}`));
          }
        });
      });
    },
  });
};