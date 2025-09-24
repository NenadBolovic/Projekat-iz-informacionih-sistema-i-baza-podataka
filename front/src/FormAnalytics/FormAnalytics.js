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
  Button,
  Stack
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { isAuthenticated } from '../auth/authUtils';

// Shared purple Button style (reused)
const purpleButtonSX = {
  textTransform: 'none',
  fontWeight: 600,
  letterSpacing: '.4px',
  background: 'linear-gradient(135deg,#5e2a9b 0%, #7b3fc4 45%, #9146d8 100%)',
  color: '#fff',
  borderRadius: 2,
  boxShadow: '0 4px 14px -4px rgba(94,42,155,0.55), 0 2px 6px rgba(94,42,155,0.35)',
  '&:hover': {
    background: 'linear-gradient(135deg,#55248c 0%, #6f38b4 45%, #833fc4 100%)',
    boxShadow: '0 6px 18px -6px rgba(94,42,155,0.6), 0 3px 10px rgba(94,42,155,0.45)'
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 3px 10px -2px rgba(94,42,155,0.55), 0 2px 6px rgba(94,42,155,0.35)'
  }
};

// Card style for purple accent
const analyticsCardSX = {
  mb: 2,
  border: '1px solid rgba(123,63,196,0.35)',
  background: 'linear-gradient(145deg,#ffffff, #faf6ff)',
  boxShadow:
    '0 6px 18px -6px rgba(94,42,155,0.25), 0 2px 10px rgba(94,42,155,0.12)',
  borderRadius: 3,
  transition: 'border-color .3s, box-shadow .3s',
  '&:hover': {
    borderColor: 'rgba(123,63,196,0.55)',
    boxShadow:
      '0 10px 24px -8px rgba(94,42,155,0.32), 0 4px 14px rgba(94,42,155,0.18)'
  }
};

// Toggle button styling
const toggleSX = {
  fontWeight: 600,
  letterSpacing: '.4px',
  color: '#5e2a9b',
  border: '1px solid rgba(123,63,196,0.35)!important',
  background: 'rgba(123,63,196,0.07)',
  '&.Mui-selected': {
    background: 'linear-gradient(135deg,#5e2a9b 0%, #7b3fc4 60%, #9146d8 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px -2px rgba(94,42,155,0.5)'
  },
  '&:hover': {
    background: 'rgba(123,63,196,0.15)'
  }
};

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
  const formsApiBase = 'http://localhost:3005/api/formsquestions';

  const resolveQuestionImageSrc = (imgPath) => {
    if (!imgPath) return null;
    if (/^https?:\/\//i.test(imgPath)) return imgPath;
    const match = imgPath.match(/(?:^|\/)images\/([^/?#]+)/i);
    if (match && match[1]) {
      return `${formsApiBase}/images/${encodeURIComponent(match[1])}`;
    }
    return `${formsApiBase}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const formatAnswerValue = (answer, question) => {
    if (!answer || answer.answer === undefined || answer.answer === '') {
      return 'No answer provided';
    }
    const questionType = question ? question.questionType : answer.questionType;
    switch (questionType) {
      case 'date':
        try {
          const dateObj = new Date(answer.answer);
            if (isNaN(dateObj)) return answer.answer;
          return dateObj.toLocaleDateString('en-CA');
        } catch {
          return answer.answer;
        }
      case 'time':
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
      case 'numeric':
        if (typeof answer.answer === 'number') return String(answer.answer);
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
      const userIds = [...new Set(answers.map(a => a.userId))].filter(id => id !== 0);
      const promises = userIds.map(id =>
        fetch(`${apiBase}/users/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
      );
      const users = await Promise.all(promises);
      const namesMap = new Map();
      users.forEach(user => {
        if (user) namesMap.set(user.userId, user.username);
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
      if (!response.ok) throw new Error('Failed to export data. The server may have encountered an error.');
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

  const handleViewChange = (_, newViewMode) => {
    if (newViewMode !== null) setViewMode(newViewMode);
  };

  const getQuestionKey = (q, index) =>
    typeof q.questionId === 'number' && !Number.isNaN(q.questionId)
      ? Number(q.questionId)
      : Number(index);

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

  const individualSubmissions = useMemo(() => {
    const submissions = new Map();
    for (const answer of answers) {
      if (!submissions.has(answer.userId)) submissions.set(answer.userId, []);
      submissions.get(answer.userId).push(answer);
    }
    return Array.from(submissions.entries());
  }, [answers]);

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

  if (loading) return <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error && !exporting) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!form) return <Alert severity="info" sx={{ m: 4 }}>No data found for this form.</Alert>;

  const totalSubmissions = new Set(answers.map(a => a.submissionId || `${a.userId}-${a.createdAt || ''}`)).size;
  const totalParticipants = new Set(answers.map(a => a.userId)).size;

  return (
    <Box sx={{ maxWidth: 980, margin: 'auto', mt: 5, px: { xs: 1.5, sm: 2 }, pb: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={2}>
        <Box>
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
            Form Analytics
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#4a1d79', mb: 1 }}>
            {form.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`${form.questions.length} question${form.questions.length === 1 ? '' : 's'}`}
              size="small"
              sx={{
                bgcolor: 'rgba(123,63,196,0.12)',
                color: '#5e2a9b',
                fontWeight: 600,
                border: '1px solid rgba(123,63,196,0.4)'
              }}
            />
            <Chip
              label={`${totalSubmissions} submission${totalSubmissions === 1 ? '' : 's'}`}
              size="small"
              sx={{
                bgcolor: 'rgba(94,42,155,0.1)',
                color: '#4a1d79',
                fontWeight: 600,
                border: '1px solid rgba(94,42,155,0.35)'
              }}
            />
            <Chip
              label={`${totalParticipants} participant${totalParticipants === 1 ? '' : 's'}`}
              size="small"
              sx={{
                bgcolor: 'rgba(145,70,216,0.12)',
                color: '#5e2a9b',
                fontWeight: 600,
                border: '1px solid rgba(145,70,216,0.4)'
              }}
            />
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
          sx={purpleButtonSX}
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </Stack>

      {error && exporting && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 1.2,
          my: 3,
          border: '1px solid rgba(123,63,196,0.4)',
          background: 'linear-gradient(145deg,#ffffff,#f9f4ff)',
          borderRadius: 3
        }}
      >
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
          sx={{
            '& .MuiToggleButtonGroup-grouped': {
              mx: 0.6,
              borderRadius: 2,
              border: 'none'
            }
          }}
        >
          <ToggleButton value="grouped" sx={toggleSX}>
            Grouped by Question
          </ToggleButton>
          <ToggleButton value="individual" sx={toggleSX}>
            Individual Submissions
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {viewMode === 'grouped' && (
        <Box>
          {form.questions.map((question, index) => {
            const imgSrc = resolveQuestionImageSrc(question.questionImage);
            const list = groupedAnswers.get(question._id) || [];
            return (
              <Card key={question._id} sx={analyticsCardSX}>
                <CardContent sx={{ pb: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, color: '#422062', letterSpacing: '.3px' }}
                  >
                    {index + 1}. {question.questionText}
                  </Typography>

                  {imgSrc && (
                    <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                      <img
                        src={imgSrc}
                        alt="Question illustration"
                        loading="lazy"
                        style={{
                          maxWidth: 220,
                          maxHeight: 130,
                          width: 'auto',
                          height: 'auto',
                          borderRadius: 8,
                          objectFit: 'contain',
                          border: '1px solid rgba(123,63,196,0.3)',
                          background: '#f9f4ff',
                          padding: 4
                        }}
                        onError={(e) => {
                          const fallback = `${formsApiBase}${question.questionImage?.startsWith('/') ? '' : '/'}${question.questionImage || ''}`;
                          if (fallback && e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                    </Box>
                  )}

                  <Divider sx={{ mb: 1.5 }} />
                  <List dense disablePadding>
                    {list.length > 0 ? (
                      list.map(answer => (
                        <ListItem
                          key={answer._id}
                          sx={{
                            borderBottom: '1px solid #eee',
                            px: 0,
                            py: 0.6,
                            '&:last-of-type': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemText
                            primaryTypographyProps={{
                              fontSize: 14,
                              sx: { color: '#4a1d79' }
                            }}
                            primary={formatAnswerValue(answer, question)}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic', px: 0.5, py: 0.5 }}
                      >
                        No answers for this question yet.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {viewMode === 'individual' && (
        <Box>
          {individualSubmissions.map(([userId, userAnswers]) => {
            const chipLabel =
              userId === 0 ? 'Anonymous' : (userNames.get(userId) || `User ID: ${userId}`);
            const filteredAnswers = userAnswers.filter(a =>
              questionTextMap.has(Number(a.questionId))
            );
            return (
              <Card key={userId} sx={analyticsCardSX}>
                <CardContent sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="span" sx={{ mr: 1.5, fontWeight: 600, color: '#422062' }}>
                      Submission from:
                    </Typography>
                    <Chip
                      label={chipLabel}
                      size="small"
                      sx={{
                        bgcolor: userId === 0 ? 'rgba(145,70,216,0.12)' : 'rgba(123,63,196,0.15)',
                        color: '#5e2a9b',
                        fontWeight: 600,
                        border: '1px solid rgba(123,63,196,0.4)'
                      }}
                    />
                  </Box>
                  <Divider />
                  {filteredAnswers.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2, fontStyle: 'italic' }}
                    >
                      No valid answers to display for this submission.
                    </Typography>
                  ) : (
                    filteredAnswers.map(answer => {
                      const qId = Number(answer.questionId);
                      const qType = questionTypeMap.get(qId);
                      const enhancedAnswer = { ...answer, questionType: qType };
                      return (
                        <Box
                          key={answer._id}
                          sx={{
                            mt: 2,
                            mb: 1,
                            p: 1.2,
                            borderRadius: 2,
                            background: 'rgba(123,63,196,0.07)',
                            border: '1px solid rgba(123,63,196,0.25)'
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: '#4a1d79' }}
                          >
                            {questionTextMap.get(qId)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              pl: 0.5,
                              mt: 0.5,
                              fontStyle: 'italic',
                              color: '#5b4677'
                            }}
                          >
                            "{formatAnswerValue(enhancedAnswer)}"
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