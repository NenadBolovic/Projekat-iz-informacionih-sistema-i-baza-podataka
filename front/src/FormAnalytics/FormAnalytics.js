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
  Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { isAuthenticated } from '../auth/authUtils';

function FormAnalytics() {
  const { formId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [userNames, setUserNames] = useState(new Map());
  
  const [viewMode, setViewMode] = useState('grouped');

  const apiBase = 'http://localhost:3005/api';
  const getToken = () => localStorage.getItem('token');

  // Base for serving images via API
  const formsApiBase = 'http://localhost:3005/api/formsquestions';

  // Resolve a stored questionImage into a fetchable URL
  const resolveQuestionImageSrc = (imgPath) => {
    if (!imgPath) return null;
    if (/^https?:\/\//i.test(imgPath)) return imgPath;

    // If path contains /images/<filename>, use images endpoint
    const match = imgPath.match(/(?:^|\/)images\/([^/?#]+)/i);
    if (match && match[1]) {
      return `${formsApiBase}/images/${encodeURIComponent(match[1])}`;
    }
    // Fallback: prefix with formsApiBase
    return `${formsApiBase}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  // Helper function to format answer values based on question type
  const formatAnswerValue = (answer, question) => {
    if (!answer || answer.answer === undefined || answer.answer === "") {
      return "No answer provided";
    }
    
    // Get the corresponding question to determine the type
    const questionType = question ? question.questionType : answer.questionType;
    
    switch (questionType) {
      case "date":
        try {
          const dateObj = new Date(answer.answer);
          if (isNaN(dateObj)) return answer.answer;
          return dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
        } catch {
          return answer.answer;
        }
      case "time":
        if (typeof answer.answer === 'string' && /^\d{2}:\d{2}$/.test(answer.answer)) {
          return answer.answer;
        }
        try {
          const timeObj = new Date(answer.answer);
          if (isNaN(timeObj)) return answer.answer;
          return timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
          return answer.answer;
        }
      case "numeric":
        if (typeof answer.answer === 'number') {
          return String(answer.answer);
        }
        return answer.answer;
      default:
        return answer.answer;
    }
  };

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

  useEffect(() => {
    if (answers.length === 0) return;

    const fetchUserNames = async () => {
      const token = getToken();
      const userIds = [...new Set(answers.map(a => a.userId))].filter(id => id !== 0); // skip anonymous
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

  const handleExport = async () => {
    setExporting(true);
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

  // Helper to get the stable question key (prefer question.questionId; fallback to index)
  const getQuestionKey = (q, index) => {
    return typeof q.questionId === 'number' && !Number.isNaN(q.questionId)
      ? Number(q.questionId)
      : Number(index);
  };

  // Group answers by question _id, matching via stable questionId
  const groupedAnswers = useMemo(() => {
    const groups = new Map();
    if (!form?.questions) return groups;
    form.questions.forEach((question, index) => {
      const key = getQuestionKey(question, index);
      const relevantAnswers = answers.filter(a => Number(a.questionId) === key);
      groups.set(question._id, relevantAnswers);
    });
    return groups;
  }, [form, answers]);

  // Submissions grouped by user
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
  
  // Maps keyed by stable questionId (number)
  const questionTextMap = useMemo(() => {
    if (!form?.questions) return new Map();
    const map = new Map();
    form.questions.forEach((q, index) => {
      const key = getQuestionKey(q, index);
      map.set(key, q.questionText);
    });
    return map;
  }, [form]);

  const questionTypeMap = useMemo(() => {
    if (!form?.questions) return new Map();
    const map = new Map();
    form.questions.forEach((q, index) => {
      const key = getQuestionKey(q, index);
      map.set(key, q.questionType);
    });
    return map;
  }, [form]);

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error && !exporting) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!form) return <Alert severity="info" sx={{ m: 4 }}>No data found for this form.</Alert>;

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4, p: 2 }}>
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
      {error && exporting && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Paper sx={{ display: 'flex', justifyContent: 'center', p: 1, my: 3 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange}>
          <ToggleButton value="grouped">Grouped by Question</ToggleButton>
          <ToggleButton value="individual">Individual Submissions</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Grouped view - with question image (small) above the answers */}
      {viewMode === 'grouped' && (
        <Box>
          {form.questions.map((question, index) => {
            const imgSrc = resolveQuestionImageSrc(question.questionImage);
            return (
              <Card key={question._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{question.questionText}</Typography>

                  {imgSrc && (
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                      <img
                        src={imgSrc}
                        alt="Slika nije ucitana"
                        loading="lazy"
                        style={{
                          maxWidth: 220,
                          maxHeight: 130,
                          width: 'auto',
                          height: 'auto',
                          borderRadius: 6,
                          objectFit: 'contain',
                          border: '1px solid #eee',
                          background: '#fafafa',
                          padding: 4,
                        }}
                        onError={(e) => {
                          // Fallback to api path concatenation if images/<filename> fails
                          const fallback = `${formsApiBase}${question.questionImage?.startsWith('/') ? '' : '/'}${question.questionImage || ''}`;
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />
                  <List dense>
                    {groupedAnswers.get(question._id)?.length > 0 ? (
                      groupedAnswers.get(question._id).map(answer => (
                        <ListItem key={answer._id} sx={{ borderBottom: '1px solid #eee' }}>
                          <ListItemText primary={formatAnswerValue(answer, question)} />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No answers for this question yet.</Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Individual view - with formatted answers and Anonymous label for userId 0 */}
      {viewMode === 'individual' && (
        <Box>
          {individualSubmissions.map(([userId, userAnswers]) => {
            const chipLabel = userId === 0
              ? 'Anonymous'
              : (userNames.get(userId) || `User ID: ${userId}`);

            // Only render answers whose question mapping exists
            const filteredAnswers = userAnswers.filter(a => questionTextMap.has(Number(a.questionId)));

            return (
              <Card key={userId} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="span" sx={{ mr: 1.5 }}>
                      Submission from:
                    </Typography>
                    <Chip label={chipLabel} color="primary" />
                  </Box>
                  <Divider />
                  {filteredAnswers.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      No valid answers to display for this submission.
                    </Typography>
                  ) : (
                    filteredAnswers.map(answer => {
                      const qId = Number(answer.questionId);
                      const questionType = questionTypeMap.get(qId);
                      const enhancedAnswer = { ...answer, questionType };
                      
                      return (
                        <Box key={answer._id} sx={{ mt: 2, mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {questionTextMap.get(qId)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ pl: 2, fontStyle: 'italic' }}>
                            - "{formatAnswerValue(enhancedAnswer)}"
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

export default FormAnalytics;