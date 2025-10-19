import React, { useState } from 'react';
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

  // Form state for different actions
  const [formData, setFormData] = useState({
    action: '',
    resourceType: 'deployment',
    resourceName: entityName,
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
      
      const response = await callKubernetesApi({
        action: 'delete-resource',
        parameters: {
          resourceType: formData.resourceType,
          resourceName: formData.resourceName,
          deleteNamespace: namespace,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.output || 'Resource deleted successfully');
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

  const renderDeleteDialog = () => (
    <Dialog open={openDialog === 'delete'} onClose={handleCloseDialog} maxWidth="sm">
      <DialogTitle>Delete Resource</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" mt={1}>
          <FormControl fullWidth>
            <InputLabel>Resource Type</InputLabel>
            <Select
              value={formData.resourceType}
              onChange={(e) => setFormData({ ...formData, resourceType: e.target.value as string })}
            >
              <MenuItem value="deployment">Deployment</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="pod">Pod</MenuItem>
              <MenuItem value="configmap">ConfigMap</MenuItem>
              <MenuItem value="secret">Secret</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Resource Name"
            value={formData.resourceName}
            onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
            fullWidth
          />
          <Typography variant="body2" color="textSecondary">
            Warning: This action cannot be undone.
          </Typography>
          {loading && <CircularProgress />}
          {result && <Alert severity="success">{result}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={executeAction} disabled={loading} color="secondary" variant="contained">
          Delete
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
      {renderDeleteDialog()}
    </Box>
  );
};