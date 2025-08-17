import React from "react";
import { Card, CardContent, Typography, Button, IconButton, Snackbar, Alert, Tooltip, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ShareIcon from '@mui/icons-material/Share';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { isAuthenticated } from '../auth/authUtils';

const FormCard = ({ form }) => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/FormEdit/${form._id}`);
  };

  const handleAnswer = () => {
    navigate(`/FormAnswering/${form._id}`);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareLink = `${window.location.origin}/FormAnswering/${form._id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setSnackbarOpen(true);
    });
  };

  const handleAnalytics = (e) => {
    e.stopPropagation();
    navigate(`/forms/analytics/${form._id}`);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <>
      <Card
        style={{
          position: "relative",
          margin: "16px",
          padding: "16px",
          width: "300px",
          border: `2px solid ${form.locked ? '#d32f2f' : '#ccc'}`,
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
          transition: "border-color 0.3s, box-shadow 0.2s",
          opacity: form.locked ? 0.85 : 1,
        }}
      >
        {/* The Edit button is no longer here */}

        <CardContent>
          <Typography variant="h5" noWrap title={form.name}>{form.name}</Typography>
          <Typography variant="body2" color="textSecondary" noWrap title={form.description}>
            {form.description || "No description."}
          </Typography>
        </CardContent>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          {form.locked ? (
            <Button variant="contained" disabled style={{ backgroundColor: '#d32f2f', color: 'white' }}>
              Form Locked
            </Button>
          ) : (
            <Button onClick={handleAnswer} variant="outlined">
              Start Answering
            </Button>
          )}
          
          {/* --- THIS IS THE CHANGE --- */}
          {/* The Edit, Analytics, and Share buttons are now grouped here and only show if the user is authenticated. */}
          {isAuthenticated() && (
            <Box>
              <Tooltip title="Edit Form">
                <IconButton onClick={handleEdit} aria-label="edit">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Analytics">
                <IconButton onClick={handleAnalytics} aria-label="analytics">
                  <AnalyticsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy sharing link">
                <IconButton onClick={handleShare} aria-label="share">
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </div>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default FormCard;