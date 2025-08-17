import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  CircularProgress, 
  Alert, 
  Paper, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import { isAuthenticated } from '../auth/authUtils'; // Use your existing auth helper

// A Reusable component for the lists inside the modal
const UserList = ({ title, users, onRemove }) => (
  <Box>
    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>{title}</Typography>
    {users.length > 0 ? (
      users.map(user => (
        <Chip
          key={user.id}
          label={user.username}
          onDelete={() => onRemove(user.id)}
          sx={{ mr: 1, mb: 1 }}
        />
      ))
    ) : (
      <Typography variant="body2" color="text.secondary">No users in this list.</Typography>
    )}
  </Box>
);


function MenageFormsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  // State for the management modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [observers, setObservers] = useState([]);
  const [usernameToAdd, setUsernameToAdd] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const apiBase = 'http://localhost:3005/api';
  const getToken = () => localStorage.getItem('token');

  // Authorization check (no change)
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    } else {
      setIsAuthorized(true);
    }
  }, [navigate, location]);

  // Fetch user's forms (no change)
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchUserForms = async () => {
      setLoading(true);
      const token = getToken();
      try {
        const response = await fetch(`${apiBase}/formsquestions/forms/related`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch your forms.');
        const data = await response.json();
        setForms(data.forms || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserForms();
  }, [isAuthorized]);

  // --- THIS IS THE FINAL, CORRECTED DELETE FUNCTION ---
  const handleDeleteForm = async (formIdToDelete) => {
    // Updated confirmation message for clarity
    if (!window.confirm('Are you sure you want to permanently delete this form and all its associated questions? This action cannot be undone.')) {
        return;
    }

    const token = getToken();
    try {
  // Calling the delete endpoint with the formId in the request body
  const response = await fetch(`${apiBase}/formsquestions/forms/deleteForm`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' // 1. Set the content type to JSON
    },
    // 2. Add the body with the formId, ensuring it's stringified
    body: JSON.stringify({
      "formId": formIdToDelete 
      })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete form.');
      }
      // This part remains the same, as it correctly updates the UI
      setForms(prevForms => prevForms.filter(form => form._id !== formIdToDelete));
    } catch (err) {
      // Use the main error state to display the error to the user
      setError(err.message);
    }
  };

  // --- All modal and permission-related functions remain unchanged ---
  const handleOpenModal = async (form) => {
    setSelectedForm(form);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError('');
    const token = getToken();

    const fetchUserDetails = async (userIds) => {
      if (!userIds || userIds.length === 0) return [];
      try {
        const promises = userIds.map(id =>
          fetch(`${apiBase}/users/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
              if (res.ok) return res.json();
              return Promise.resolve({ userId: id, username: `Unknown (ID: ${id})` });
            })
            .then(data => ({ id: data.userId, username: data.username }))
        );
        return await Promise.all(promises);
      } catch (err) {
        setModalError('A network error occurred while fetching user details.');
        return [];
      }
    };

    const [collabDetails, observerDetails] = await Promise.all([
      fetchUserDetails(form.collaborators),
      fetchUserDetails(form.observers),
    ]);

    setCollaborators(collabDetails);
    setObservers(observerDetails);
    setModalLoading(false);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedForm(null);
    setCollaborators([]);
    setObservers([]);
    setUsernameToAdd('');
    setModalError('');
  };

  const handleAddUser = async (listType) => {
    if (!usernameToAdd.trim()) return;
    setModalError('');
    const token = getToken();
    const list = listType === 'collaborators' ? collaborators : observers;
    const setList = listType === 'collaborators' ? setCollaborators : setObservers;

    try {
      const res = await fetch(`${apiBase}/users/users/search/${usernameToAdd.trim()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success && data.users.length > 0) {
        const user = { id: data.users[0].userId, username: data.users[0].username };
        if (!list.some(u => u.id === user.id)) {
          setList(prev => [...prev, user]);
          setUsernameToAdd('');
        } else {
          setModalError(`User '${user.username}' is already in the list.`);
        }
      } else {
        setModalError(`User '${usernameToAdd.trim()}' not found.`);
      }
    } catch {
      setModalError('An error occurred while searching for the user.');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedForm) return;
    setModalLoading(true);
    const token = getToken();
    const payload = {
      ...selectedForm,
      formId: selectedForm._id,
      collaborators: collaborators.map(u => u.id),
      observers: observers.map(u => u.id),
    };

    try {
      const res = await fetch(`${apiBase}/formsquestions/forms/updateForm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save permissions.');
      }
      setForms(prev => prev.map(f => f._id === selectedForm._id ? { ...f, collaborators: payload.collaborators, observers: payload.observers } : f));
      handleCloseModal();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };


  if (!isAuthorized) return <div style={{ padding: '2rem' }}>Authorizing...</div>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>Manage Your Forms</Typography>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
      {!loading && !error && (
        <Paper elevation={2}>
          <List>
            {forms.length > 0 ? (
              forms.map(form => (
                <ListItem
                  key={form._id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenModal(form)}
                      >
                        Manage
                      </Button>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteForm(form._id)} title="Delete Form">
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText 
                    primary={form.name} 
                    secondary={`Collaborators: ${form.collaborators.length} | Observers: ${form.observers.length}`} 
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ p: 2, textAlign: 'center' }}>You have not created any forms yet.</Typography>
            )}
          </List>
        </Paper>
      )}

      {/* --- The management modal dialog (no changes here) --- */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>Manage Permissions for "{selectedForm?.name}"</DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
              
              <Typography variant="h6">Add New User</Typography>
              <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                <TextField
                  label="Enter username"
                  value={usernameToAdd}
                  onChange={(e) => setUsernameToAdd(e.target.value)}
                  fullWidth
                  size="small"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUser('collaborators')}
                />
                <Button onClick={() => handleAddUser('collaborators')}>As Collaborator</Button>
                <Button onClick={() => handleAddUser('observers')}>As Observer</Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <UserList
                title="Current Collaborators"
                users={collaborators}
                onRemove={(userId) => setCollaborators(prev => prev.filter(u => u.id !== userId))}
              />

              <UserList
                title="Current Observers"
                users={observers}
                onRemove={(userId) => setObservers(prev => prev.filter(u => u.id !== userId))}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseModal} disabled={modalLoading}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained" disabled={modalLoading}>
            {modalLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MenageFormsPage;