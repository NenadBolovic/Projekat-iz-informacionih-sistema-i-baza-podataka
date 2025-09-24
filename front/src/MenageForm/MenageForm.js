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
  Divider,
  Fade,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { isAuthenticated } from '../auth/authUtils';

// Reusable user list inside modal
const UserList = ({ title, users, onRemove }) => (
  <Box>
    <Typography
      variant="subtitle2"
      sx={{
        mt: 3,
        mb: 1,
        fontWeight: 600,
        letterSpacing: '.5px',
        color: '#4a1d79'
      }}
    >
      {title}
    </Typography>
    {users.length > 0 ? (
      users.map(user => (
        <Chip
          key={user.id}
          label={user.username}
            onDelete={() => onRemove(user.id)}
          sx={{
            mr: 1,
            mb: 1,
            bgcolor: 'rgba(123,63,196,0.12)',
            color: '#4a1d79',
            border: '1px solid rgba(123,63,196,0.35)',
            '& .MuiChip-deleteIcon': {
              color: 'rgba(74,29,121,0.7)'
            },
            '&:hover': {
              bgcolor: 'rgba(123,63,196,0.2)'
            }
          }}
        />
      ))
    ) : (
      <Typography variant="body2" color="text.secondary">
        No users in this list.
      </Typography>
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [observers, setObservers] = useState([]);
  const [usernameToAdd, setUsernameToAdd] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const apiBase = 'http://localhost:3005/api';
  const getToken = () => localStorage.getItem('token');

  // Auth check
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    } else {
      setIsAuthorized(true);
    }
  }, [navigate, location]);

  // Fetch forms
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchUserForms = async () => {
      setLoading(true);
      setError('');
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

  // Delete form
  const handleDeleteForm = async (formIdToDelete) => {
    if (!window.confirm('Are you sure you want to permanently delete this form and all its associated questions? This action cannot be undone.')) {
      return;
    }
    const token = getToken();
    try {
      const response = await fetch(`${apiBase}/formsquestions/forms/deleteForm`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formId: formIdToDelete })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete form.');
      }
      setForms(prevForms => prevForms.filter(form => form._id !== formIdToDelete));
    } catch (err) {
      setError(err.message);
    }
  };

  // Open modal + load user details
  const handleOpenModal = async (form) => {
    setSelectedForm(form);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    const token = getToken();

    const fetchUserDetails = async (userIds) => {
      if (!userIds || userIds.length === 0) return [];
      try {
        const promises = userIds.map(id =>
          fetch(`${apiBase}/users/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : Promise.resolve({ userId: id, username: `Unknown (ID: ${id})` }))
            .then(data => ({ id: data.userId, username: data.username }))
        );
        return await Promise.all(promises);
      } catch {
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
    setModalSuccess('');
  };

  // Add user to collaborators or observers
  const handleAddUser = async (listType) => {
    if (!usernameToAdd.trim()) return;
    setModalError('');
    setModalSuccess('');
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
          setModalSuccess(`User '${user.username}' added as ${listType === 'collaborators' ? 'collaborator' : 'observer'}.`);
          setTimeout(() => setModalSuccess(''), 3000);
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

  // Save permissions
  const handleSavePermissions = async () => {
    if (!selectedForm) return;
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
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
      setForms(prev =>
        prev.map(f =>
          f._id === selectedForm._id
            ? { ...f, collaborators: payload.collaborators, observers: payload.observers }
            : f
        )
      );
      setModalSuccess('Permissions saved successfully.');
      setTimeout(() => {
        setModalSuccess('');
        handleCloseModal();
      }, 1200);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  if (!isAuthorized) return <div style={{ padding: '2rem' }}>Authorizing...</div>;

  return (
    <Box sx={{ maxWidth: 960, margin: 'auto', mt: 5, px: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            letterSpacing: '.5px',
            background: 'linear-gradient(90deg,#5e2a9b,#9146d8)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          Manage Your Forms
        </Typography>
        {forms.length > 0 && (
          <Chip
            label={`${forms.length} form${forms.length === 1 ? '' : 's'}`}
            sx={{
              bgcolor: 'rgba(145,70,216,0.12)',
              color: '#5e2a9b',
              fontWeight: 600,
              border: '1px solid rgba(145,70,216,0.4)'
            }}
          />
        )}
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid rgba(123,63,196,0.55)',
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.85), rgba(250,245,255,0.9))',
            backdropFilter: 'blur(4px)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow:
              '0 8px 26px -8px rgba(94,42,155,0.25), 0 4px 12px rgba(94,42,155,0.15)'
          }}
        >
          <List
            sx={{
              '& .MuiListItem-root': {
                transition: 'background .25s, border-color .25s'
              }
            }}
          >
            {forms.length > 0 ? (
              forms.map(form => (
                <ListItem
                  key={form._id}
                  divider
                  sx={{
                    alignItems: 'flex-start',
                    '&:hover': {
                      background: 'rgba(123,63,196,0.07)'
                    }
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SettingsIcon />}
                        onClick={() => handleOpenModal(form)}
                        sx={purpleButtonSX}
                      >
                        Manage
                      </Button>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteForm(form._id)}
                        title="Delete Form"
                        sx={{
                          bgcolor: 'rgba(255,0,0,0.06)',
                          '&:hover': { bgcolor: 'rgba(255,0,0,0.14)' }
                        }}
                      >
                        <DeleteIcon color="error" fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: '#422062' }}
                      >
                        {form.name}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{ color: '#6d4d92', letterSpacing: '.3px' }}
                      >
                        Collaborators: {form.collaborators.length} | Observers: {form.observers.length}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            ) : (
              <Typography sx={{ p: 3, textAlign: 'center', color: '#5e2a9b' }}>
                You have not created any forms yet.
              </Typography>
            )}
          </List>
        </Paper>
      )}

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            border: '1px solid rgba(123,63,196,0.55)',
            background:
              'linear-gradient(150deg, rgba(255,255,255,0.95), rgba(242,232,255,0.98))',
            boxShadow:
              '0 10px 34px -10px rgba(94,42,155,0.4), 0 4px 14px rgba(94,42,155,0.25)'
          }
        }}
        TransitionComponent={Fade}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            letterSpacing: '.5px',
            color: '#4a1d79'
          }}
        >
          Manage Permissions for "{selectedForm?.name}"
        </DialogTitle>
        <DialogContent>
          {modalLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {modalError && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    border: '1px solid rgba(255,0,0,0.3)'
                  }}
                >
                  {modalError}
                </Alert>
              )}
              {modalSuccess && (
                <Alert
                  icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                  severity="success"
                  sx={{
                    mb: 2,
                    border: '1px solid rgba(76,175,80,0.3)'
                  }}
                >
                  {modalSuccess}
                </Alert>
              )}

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: '#5a258d',
                  mb: 1
                }}
              >
                Add New User
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1 }}>
                <TextField
                  label="Enter username"
                  value={usernameToAdd}
                  onChange={(e) => setUsernameToAdd(e.target.value)}
                  fullWidth
                  size="small"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUser('collaborators');
                    }
                  }}
                />
                <Button
                  onClick={() => handleAddUser('collaborators')}
                  variant="contained"
                  sx={purpleButtonSX}
                >
                  As Collaborator
                </Button>
                <Button
                  onClick={() => handleAddUser('observers')}
                  variant="contained"
                  sx={purpleButtonSX}
                >
                  As Observer
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <UserList
                title="Current Collaborators"
                users={collaborators}
                onRemove={(userId) =>
                  setCollaborators(prev => prev.filter(u => u.id !== userId))
                }
              />

              <UserList
                title="Current Observers"
                users={observers}
                onRemove={(userId) =>
                  setObservers(prev => prev.filter(u => u.id !== userId))
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px', gap: 1.5 }}>
          <Button onClick={handleCloseModal} disabled={modalLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            disabled={modalLoading}
            sx={purpleButtonSX}
          >
            {modalLoading ? <CircularProgress size={22} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const purpleButtonSX = {
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '.5px',
  background:
    'linear-gradient(135deg,#5e2a9b 0%, #7b3fc4 45%, #9146d8 100%)',
  color: '#fff',
  borderRadius: 2,
  boxShadow:
    '0 4px 14px -4px rgba(94,42,155,0.55), 0 2px 6px rgba(94,42,155,0.35)',
  px: 2.4,
  '&:hover': {
    background:
      'linear-gradient(135deg,#56258f 0%, #6f38b4 45%, #823ec2 100%)',
    boxShadow:
      '0 6px 18px -6px rgba(94,42,155,0.6), 0 3px 10px rgba(94,42,155,0.45)'
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow:
      '0 3px 10px -2px rgba(94,42,155,0.55), 0 2px 6px rgba(94,42,155,0.35)'
  }
};

export default MenageFormsPage;