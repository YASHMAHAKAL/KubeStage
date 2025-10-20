import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { createKubernetesApplyAction } from './actions/kubernetes-apply';

export const kubernetesScaffolderActionsModule = createBackendModule({
  pluginId: 'scaffolder', 
  moduleId: 'kubernetes-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolder }) {
        scaffolder.addActions(createKubernetesApplyAction());
      },
    });
  },
});