import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import { createKubernetesActionRouter } from './router';

/**
 * Backend plugin that provides HTTP API endpoints for Kubernetes actions
 * 
 * @public
 */
export const kubernetesActionsPlugin = createBackendPlugin({
  pluginId: 'kubernetes-actions',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ httpRouter, logger, config }) {
        logger.info('Initializing Kubernetes Actions plugin');
        const router = await createKubernetesActionRouter({ 
          logger, 
          config
        });
        
        // Add auth policy
        httpRouter.addAuthPolicy({
          path: '/',
          allow: 'unauthenticated',
        });
        
        // Use the router - will be mounted at /api/kubernetes-actions
        httpRouter.use(router);
      },
    });
  },
});

// Keep the module as well for backward compatibility
export const kubernetesActionsApiModule = kubernetesActionsPlugin;