import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  Chip,
  makeStyles,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { PlayArrow, Delete, Add } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  formField: {
    marginBottom: theme.spacing(2),
  },
}));

interface KubernetesActionButtonsProps {
  entityName: string;
  namespace?: string;
}

export const KubernetesActionButtons: React.FC<KubernetesActionButtonsProps> = ({
  entityName,
  namespace = 'default',
}) => {
  const classes = useStyles();
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableResources, setAvailableResources] = useState<Array<{name: string, type: string}>>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Form state for different actions
  const [formData, setFormData] = useState({
    action: '',
    resourceType: 'deployment',
    resourceName: entityName,
    resourceNames: [] as string[], // For multi-select deletion
    image: 'nginx:latest',
    replicas: 1,
    port: 80,
    serviceType: 'ClusterIP',
  });

  const handleOpenDialog = (actionType: string) => {
    setFormData({ ...formData, action: actionType });
    setOpenDialog(actionType);
    setResult(null);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(null);
    setLoading(false);
    setResult(null);
    setError(null);
  };

  // Fetch available resources when delete dialog opens
  useEffect(() => {
    if (openDialog === 'delete' && formData.resourceType && namespace) {
      fetchAvailableResources(formData.resourceType);
    }
  }, [openDialog, formData.resourceType, namespace]);

  const callKubernetesApi = async (payload: any) => {
    // Use the backend URL directly since it runs on port 7007
    const backendUrl = window.location.protocol === 'https:' ? 
      window.location.origin.replace('3000', '7007') : 
      'http://localhost:7007';
    
    const response = await fetch(`${backendUrl}/api/kubernetes-actions/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return response;
  };

  const fetchAvailableResources = async (resourceType: string) => {
    try {
      setLoadingResources(true);
      const backendUrl = window.location.protocol === 'https:' ? 
        window.location.origin.replace('3000', '7007') : 
        'http://localhost:7007';
      
      const response = await fetch(`${backendUrl}/api/kubernetes-actions/resources/${resourceType}?namespace=${namespace}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      const data = await response.json();
      setAvailableResources(data.resources || []);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      setAvailableResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCreateDeployment = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await callKubernetesApi({
        action: 'create-deployment',
        parameters: {
          name: formData.resourceName,
          image: formData.image,
          replicas: formData.replicas.toString(),
          port: formData.port.toString(),
          namespace: namespace,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.output || 'Deployment created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await callKubernetesApi({
        action: 'create-service',
        parameters: {
          serviceName: formData.resourceName,
          targetApp: formData.resourceName,
          servicePort: formData.port.toString(),
          serviceType: formData.serviceType,
          targetPort: formData.port.toString(),
          serviceNamespace: namespace,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.output || 'Service created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePod = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await callKubernetesApi({
        action: 'create-pod',
        parameters: {
          podName: formData.resourceName,
          podImage: formData.image,
          podPort: formData.port.toString(),
          podNamespace: namespace,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.output || 'Pod created successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use resourceNames if multiple selected, otherwise use single resourceName
      const resourcesToDelete = formData.resourceNames.length > 0 ? formData.resourceNames : [formData.resourceName];
      
      if (resourcesToDelete.length === 0 || resourcesToDelete.every(name => !name || name.trim() === '')) {
        throw new Error('Please select at least one resource to delete');
      }
      
      const response = await callKubernetesApi({
        action: 'delete-resource',
        parameters: {
          resourceType: formData.resourceType,
          resourceNames: resourcesToDelete,
          deleteNamespace: namespace,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const resourceCount = resourcesToDelete.length;
      const resourceText = resourceCount === 1 ? 'Resource' : `${resourceCount} resources`;
      setResult(data.output || `${resourceText} deleted successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleScaleDeployment = async () => {
    // Scale operation could be added to the backend API later
    // For now, we'll just show a placeholder message
    setResult(`Scaling deployment ${formData.resourceName} to ${formData.replicas} replicas`);
  };

  const executeAction = async () => {
    try {
      switch (formData.action) {
        case 'create-deployment':
          await handleCreateDeployment();
          break;
        case 'create-service':
          await handleCreateService();
          break;
        case 'create-pod':
          await handleCreatePod();
          break;
        case 'delete':
          await handleDeleteResource();
          break;
        case 'scale':
          await handleScaleDeployment();
          break;
        default:
          throw new Error('Unknown action');
      }
    } catch (err) {
      // Error is already handled in individual action methods
    }
  };

  const renderCreateDeploymentDialog = () => (
    <Dialog open={openDialog === 'create-deployment'} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>Create Deployment</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" mt={1}>
          <TextField
            label="Deployment Name"
            value={formData.resourceName}
            onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
            fullWidth
            className={classes.formField}
          />
          <TextField
            label="Container Image"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            fullWidth
            placeholder="nginx:latest"
          />
          <TextField
            label="Replicas"
            type="number"
            value={formData.replicas}
            onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Container Port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            fullWidth
          />
          {loading && <CircularProgress />}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={executeAction} disabled={loading} color="primary" variant="contained">
          Create Deployment
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCreateServiceDialog = () => (
    <Dialog open={openDialog === 'create-service'} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>Create Service</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" mt={1}>
          <TextField
            label="Service Name"
            value={formData.resourceName}
            onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Service Type</InputLabel>
            <Select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as string })}
            >
              <MenuItem value="ClusterIP">ClusterIP</MenuItem>
              <MenuItem value="NodePort">NodePort</MenuItem>
              <MenuItem value="LoadBalancer">LoadBalancer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            fullWidth
          />
          {loading && <CircularProgress />}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={executeAction} disabled={loading} color="primary" variant="contained">
          Create Service
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderCreatePodDialog = () => (
    <Dialog open={openDialog === 'create-pod'} onClose={handleCloseDialog} maxWidth="md">
      <DialogTitle>Create Pod</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" mt={1}>
          <TextField
            label="Pod Name"
            value={formData.resourceName}
            onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
            fullWidth
            className={classes.formField}
          />
          <TextField
            label="Container Image"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            fullWidth
            placeholder="nginx:latest"
          />
          <TextField
            label="Container Port"
            type="number"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
            fullWidth
          />
          {loading && <CircularProgress />}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={executeAction} disabled={loading} color="primary" variant="contained">
          Create Pod
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog open={openDialog === 'delete'} onClose={handleCloseDialog} maxWidth="sm">
      <DialogTitle>Delete Resource</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" mt={1}>
          <FormControl fullWidth>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={formData.resourceType}
              onChange={(e) => {
                const newResourceType = e.target.value as string;
                setFormData({ ...formData, resourceType: newResourceType, resourceName: '', resourceNames: [] });
                // Reset available resources when type changes
                setAvailableResources([]);
                // Fetch new resources for the selected type
                if (namespace) {
                  fetchAvailableResources(newResourceType);
                }
              }}
            >
              <MenuItem value="deployment">Deployment</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="pod">Pod</MenuItem>
              <MenuItem value="configmap">ConfigMap</MenuItem>
              <MenuItem value="secret">Secret</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth style={{ marginTop: 16 }}>
            <InputLabel>Resource Names (Select Multiple)</InputLabel>
            <Select
              multiple
              value={formData.resourceNames}
              onChange={(e) => setFormData({ ...formData, resourceNames: e.target.value as string[] })}
              disabled={loadingResources}
              renderValue={(selected) => {
                const selectedArray = selected as string[];
                if (selectedArray.length === 0) {
                  return 'No resources selected';
                }
                return (
                  <Box display="flex" flexWrap="wrap" style={{ gap: '4px' }}>
                    {selectedArray.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                );
              }}
            >
              {loadingResources ? (
                <MenuItem disabled>
                  <CircularProgress size={20} style={{ marginRight: 8 }} />
                  Loading resources...
                </MenuItem>
              ) : availableResources.length === 0 ? (
                <MenuItem disabled>No resources found</MenuItem>
              ) : (
                availableResources.map((resource) => (
                  <MenuItem key={resource.name} value={resource.name}>
                    {resource.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: 16 }}>
            Warning: This action cannot be undone. 
            {formData.resourceNames.length > 0 && (
              <strong> {formData.resourceNames.length} resource{formData.resourceNames.length > 1 ? 's' : ''} will be deleted.</strong>
            )}
          </Typography>
          {loading && <CircularProgress />}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={executeAction} disabled={loading || formData.resourceNames.length === 0} color="secondary" variant="contained">
          {formData.resourceNames.length === 0 
            ? 'Select Resources' 
            : formData.resourceNames.length === 1 
              ? 'Delete Resource' 
              : `Delete ${formData.resourceNames.length} Resources`}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box display="flex" flexWrap="wrap" style={{ gap: '8px' }}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Add />}
        onClick={() => handleOpenDialog('create-deployment')}
      >
        Create Deployment
      </Button>
      
      <Button
        variant="outlined"
        color="primary"
        startIcon={<PlayArrow />}
        onClick={() => handleOpenDialog('create-service')}
      >
        Create Service
      </Button>
      
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Add />}
        onClick={() => handleOpenDialog('create-pod')}
      >
        Create Pod
      </Button>
      
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<Delete />}
        onClick={() => handleOpenDialog('delete')}
      >
        Delete Resource
      </Button>

      {renderCreateDeploymentDialog()}
      {renderCreateServiceDialog()}
  {renderCreatePodDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};