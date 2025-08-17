import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Paper, 
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button // 1. Import Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download'; // 1. Import the icon
import { isAuthenticated } from '../auth/authUtils';

function FormAnalytics() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false); // 2. New state for the export process
  
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [userNames, setUserNames] = useState(new Map());
  
  const [viewMode, setViewMode] = useState('grouped');

  const apiBase = 'http://localhost:3005/api';
  const getToken = () => localStorage.getItem('token');

  // This useEffect fetches the core form and answer data (no changes here)
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      const token = getToken();
      try {
        const [formRes, answersRes] = await Promise.all([
          fetch(`${apiBase}/formsquestions/forms/${formId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiBase}/answers/answers/${formId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!formRes.ok) throw new Error('Failed to fetch form details. You may not have permission.');
        if (!answersRes.ok) throw new Error('Failed to fetch form answers.');

        const formDetails = await formRes.json();
        const answersData = await answersRes.json();
        
        setForm(formDetails.form || formDetails);
        setAnswers(answersData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId, navigate]);

  // This useEffect fetches usernames after answers are loaded (no changes here)
  useEffect(() => {
    if (answers.length === 0) return;

    const fetchUserNames = async () => {
      const token = getToken();
      const userIds = [...new Set(answers.map(a => a.userId))];
      
      const promises = userIds.map(id =>
        fetch(`${apiBase}/users/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
      );

      const users = await Promise.all(promises);
      
      const namesMap = new Map();
      users.forEach(user => {
        if (user) {
          namesMap.set(user.userId, user.username);
        }
      });
      setUserNames(namesMap);
    };

    fetchUserNames();
  }, [answers]);

  // 3. New function to handle the Excel export
  const handleExport = async () => {
    setExporting(true);
    // Clear previous export-related errors
    setError('');
    const token = getToken();

    try {
      const response = await fetch(`${apiBase}/answers/answers/export/${formId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to export data. The server may have encountered an error.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use the form name in the filename, with a fallback
      link.setAttribute('download', `${form.name || 'form-data'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };


  const handleViewChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // All memoized data processing hooks remain unchanged
  const groupedAnswers = useMemo(() => {
    const groups = new Map();
    if (!form?.questions) return groups;
    form.questions.forEach((question, index) => {
      const relevantAnswers = answers.filter(a => a.questionId === index);
      groups.set(question._id, relevantAnswers);
    });
    return groups;
  }, [form, answers]);

  const individualSubmissions = useMemo(() => {
    const submissions = new Map();
    for (const answer of answers) {
      if (!submissions.has(answer.userId)) {
        submissions.set(answer.userId, []);
      }
      submissions.get(answer.userId).push(answer);
    }
    return Array.from(submissions.entries());
  }, [answers]);
  
  const questionTextMap = useMemo(() => {
    if (!form?.questions) return new Map();
    const map = new Map();
    form.questions.forEach((q, index) => map.set(index, q.questionText));
    return map;
  }, [form]);


  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  // Don't show a full-page error if the error is just from a failed export
  if (error && !exporting) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!form) return <Alert severity="info" sx={{ m: 4 }}>No data found for this form.</Alert>;

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4, p: 2 }}>
      {/* 4. Updated header with the export button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Form Analytics</Typography>
          <Typography variant="h6" color="text.secondary">{form.name}</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </Box>
      {/* Show an alert specifically for export errors */}
      {error && exporting && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Paper sx={{ display: 'flex', justifyContent: 'center', p: 1, my: 3 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange}>
          <ToggleButton value="grouped">Grouped by Question</ToggleButton>
          <ToggleButton value="individual">Individual Submissions</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Grouped view - unchanged */}
      {viewMode === 'grouped' && (
        <Box>
          {form.questions.map(question => (
            <Card key={question._id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{question.questionText}</Typography>
                <Divider sx={{ mb: 2 }} />
                <List dense>
                  {groupedAnswers.get(question._id)?.length > 0 ? (
                    groupedAnswers.get(question._id).map(answer => (
                      <ListItem key={answer._id} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemText primary={answer.answer} />
                      </ListItem>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">No answers for this question yet.</Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Individual view - unchanged */}
      {viewMode === 'individual' && (
        <Box>
          {individualSubmissions.map(([userId, userAnswers]) => (
            <Card key={userId} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="span" sx={{ mr: 1.5 }}>
                    Submission from:
                  </Typography>
                  <Chip
                    label={userNames.get(userId) || `User ID: ${userId}`}
                    color="primary"
                  />
                </Box>
                <Divider />
                {userAnswers.map(answer => (
                  <Box key={answer._id} sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {questionTextMap.get(answer.questionId) || `Unknown Question (ID: ${answer.questionId})`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2, fontStyle: 'italic' }}>
                      - "{answer.answer}"
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default FormAnalytics;