// Full and complete code for EditFormPage.jsx
// Updated with isDirty optimization
// User: NenadBolovic
// Date: 2025-09-24

import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  Switch,
  FormGroup,
  FormControlLabel,
  FormControl,
  IconButton,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PeopleIcon from "@mui/icons-material/People";
import { useParams, useNavigate } from "react-router-dom";

const apiBase = "http://localhost:3005/api/formsquestions";
const formsApiBase = apiBase; // for clarity if serving images from same base

// Helper: current user id
const getCurrentUserId = () => {
  try {
    const userId = localStorage.getItem("userId");
    return userId ? parseInt(userId, 10) : null;
  } catch (e) {
    console.error("Could not get user ID from localStorage", e);
    return null;
  }
};

// Return the smallest non-negative integer not used by any existing questionId
const getNextAvailableQuestionId = (questions) => {
  const used = new Set(
    (questions || [])
      .map((q) => q?.questionId)
      .filter((id) => typeof id === "number" && !Number.isNaN(id))
  );
  let next = 0;
  while (used.has(next)) next += 1;
  return next;
};

// Resolve image URL
const resolveQuestionImageSrc = (imgPath) => {
  if (!imgPath) return null;
  if (/^https?:\/\//i.test(imgPath)) return imgPath;
  const match = imgPath.match(/(?:^|\/)images\/([^/?#]+)/i);
  if (match && match[1]) {
    return `${formsApiBase}/images/${encodeURIComponent(match[1])}`;
  }
  return `${formsApiBase}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
};

function EditFormPage() {
  const { formId } = useParams();
  const navigate = useNavigate();

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [allowAnonymous, setAllowAnonymous] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [observers, setObservers] = useState([]);
  const [creatorId, setCreatorId] = useState(null);

  // UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isCreator =
    creatorId != null && Number(creatorId) === getCurrentUserId();

  const getToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Access Denied. Please log in.");
      navigate("/login");
    }
    return token;
  };

  // Fetch form & questions
  const fetchForm = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to fetch form: ${txt}`);
      }
      const { form } = await res.json();
      setFormName(form.name || "");
      setFormDescription(form.description || "");
      setAllowAnonymous(!!form.indicator);
      setIsLocked(!!form.locked);
      setCollaborators(form.collaborators || []);
      setObservers(form.observers || []);
      setCreatorId(form.authId);

      // Map questions with stable IDs and add isDirty flag = false
      const loadedQuestions = (form.questions || []).map((q, idx) => ({
        ...q,
        questionId:
          typeof q.questionId === "number" ? q.questionId : idx,
        tempId: q._id || `${Date.now()}-${Math.random()}`,
        localImageFile: null,
        localImagePreview: null,
        isDirty: false,
      }));
      setQuestions(loadedQuestions);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Local update (mark dirty)
  const handleUpdateQuestionLocal = (tempId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.tempId === tempId ? { ...q, [field]: value, isDirty: true } : q
      )
    );
  };

  // Add new question (isDirty = true)
  const handleAddQuestionLocal = () => {
    setQuestions((prev) => {
      const nextId = getNextAvailableQuestionId(prev);
      return [
        ...prev,
        {
          tempId: `${Date.now()}-${Math.random()}`,
            questionId: nextId,
          questionText: "New Question",
          questionType: "short-text",
          required: 0,
          options: [],
          localImageFile: null,
          localImagePreview: null,
          isDirty: true,
        },
      ];
    });
  };

  // Remove newly added (not yet saved) question
  const handleRemoveNewQuestionLocal = (tempId) => {
    setQuestions((prev) => prev.filter((x) => x.tempId !== tempId || x._id));
  };

  // Visual reorder only
  const handleMoveQuestion = (index, direction) => {
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(index + (direction === "up" ? -1 : 1), 0, moved);
      return next;
    });
  };

  // Sanitize for create
  const sanitizeForCreate = (q) => {
    const {
      tempId,
      _id,
      __v,
      localImageFile,
      localImagePreview,
      isDirty,
      ...rest
    } = q || {};
    return {
      questionId: rest.questionId,
      questionText: rest.questionText ?? "",
      questionType: rest.questionType ?? "short-text",
      required: rest.required ? 1 : 0,
      options: Array.isArray(rest.options) ? rest.options : [],
      ...(rest.questionImage ? { questionImage: rest.questionImage } : {}),
      ...(rest.numericAttributes
        ? { numericAttributes: rest.numericAttributes }
        : {}),
    };
  };

  // Sanitize for update (send only modifiable fields)
  const sanitizeForUpdate = (q) => {
    const {
      tempId,
      _id,
      __v,
      formId: _ignore,
      questionId: _keep,
      localImageFile,
      localImagePreview,
      isDirty,
      ...rest
    } = q || {};
    const updateData = {};
    if (rest.questionText !== undefined)
      updateData.questionText = rest.questionText;
    if (rest.questionType !== undefined)
      updateData.questionType = rest.questionType;
    if (rest.required !== undefined)
      updateData.required = rest.required ? 1 : 0;
    if (rest.options !== undefined)
      updateData.options = Array.isArray(rest.options) ? rest.options : [];
    if (rest.questionImage !== undefined)
      updateData.questionImage = rest.questionImage;
    if (rest.numericAttributes !== undefined)
      updateData.numericAttributes = rest.numericAttributes;
    return updateData;
  };

  const readResponseBody = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    return await res.text();
  };

  // Update form metadata
  const updateFormDetails = async () => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const payload = {
      formId: formId,
      name: formName,
      description: formDescription,
      indicator: Number(allowAnonymous),
      locked: Number(isLocked),
      collaborators,
      observers,
    };
    const res = await fetch(`${apiBase}/forms/updateForm`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await readResponseBody(res);
    if (!res.ok)
      throw new Error(
        `Failed to update form details: ${JSON.stringify(body)}`
      );
    return body;
  };

  // Update one existing question (ONLY if dirty)
  const updateOneQuestion = async (q) => {
    if (!q.isDirty) return; // skip clean
    const token = getToken();
    if (!token) throw new Error("No token");

    const updateData = sanitizeForUpdate(q);
    if (q.localImageFile instanceof File) {
      // if new image selected, remove old path so backend sets new
      delete updateData.questionImage;
    }

    const nested = { questionId: q._id, updateData };
    const formData = new FormData();
    formData.append("updateData", JSON.stringify(nested));
    if (q.localImageFile instanceof File) {
      const key = `questionImage-${Number(q.questionId)}`;
      formData.append(key, q.localImageFile);
    }

    const res = await fetch(`${apiBase}/questions/updateQuestion`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = await readResponseBody(res);
    if (!res.ok)
      throw new Error(
        `Update failed for question ${q._id}: ${JSON.stringify(body)}`
      );
    return body;
  };

  // Add new questions (batch)
  const addNewQuestions = async (newQuestions) => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const formData = new FormData();
    const cleanQuestions = newQuestions.map(sanitizeForCreate);
    const formDataJson = { formId, questions: cleanQuestions };
    formData.append("formData", JSON.stringify(formDataJson));

    newQuestions.forEach((q) => {
      if (q.localImageFile instanceof File) {
        const key = `questionImage-${Number(q.questionId)}`;
        formData.append(key, q.localImageFile);
      }
    });

    const res = await fetch(`${apiBase}/questions/addQuestions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = await readResponseBody(res);
    if (!res.ok)
      throw new Error(`Add questions failed: ${JSON.stringify(body)}`);
    return body;
  };

  // Delete one question
  const deleteOneQuestion = async (questionId) => {
    const token = getToken();
    if (!token) throw new Error("No token");
    const res = await fetch(`${apiBase}/questions/deleteQuestion`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId }),
    });
    const body = await readResponseBody(res);
    if (!res.ok)
      throw new Error(`Delete failed for question ${questionId}: ${JSON.stringify(body)}`);
    return body;
  };

  // SAVE ALL
  const handleSaveAll = async () => {
    setIsSaving(true);
    setError("");
    try {
      await updateFormDetails();

      const newOnes = questions.filter((q) => !q._id);
      const dirtyExisting = questions.filter((q) => q._id && q.isDirty);

      // Add new
      if (newOnes.length > 0) {
        const resp = await addNewQuestions(newOnes);

        // Ako backend vraća listu kreiranih:
        // Očekivani oblik (primer): { created: [ { _id, questionId, questionImage?, ... }, ... ] }
        if (resp?.created && Array.isArray(resp.created)) {
          setQuestions((prev) => {
            const copy = [...prev];
            resp.created.forEach((serverQ) => {
              const idx = copy.findIndex(
                (loc) => !loc._id && loc.questionId === serverQ.questionId
              );
              if (idx !== -1) {
                copy[idx] = {
                  ...copy[idx],
                  _id: serverQ._id,
                  questionImage:
                    serverQ.questionImage ?? copy[idx].questionImage,
                  localImageFile: null,
                  localImagePreview: null,
                  isDirty: false,
                };
              }
            });
            return copy;
          });
        } else {
          // Ako backend ne vraća ništa korisno, možeš alternativno refetch:
          // await fetchForm();
        }
      }

      // Update samo izmenjena
      for (const q of dirtyExisting) {
        await updateOneQuestion(q);
      }

      // Reset isDirty na svima
      setQuestions((prev) =>
        prev.map((q) => ({ ...q, isDirty: false, localImageFile: null }))
      );

      alert("Form saved successfully");
      navigate('/', { replace: true });
    } catch (e) {
      console.error("Save failed:", e);
      setError(e.message || String(e));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete existing question
  const handleDeleteExistingQuestion = async (q) => {
    if (!q?._id) return;
    const ok = window.confirm(
      "Delete this question from the server? This cannot be undone."
    );
    if (!ok) return;
    try {
      await deleteOneQuestion(q._id);
      setQuestions((prev) => prev.filter((x) => x._id !== q._id));
    } catch (e) {
      console.error("Delete question failed:", e);
      setError(e.message || String(e));
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );

  return (
    <div
      className="form-container"
      style={{ maxWidth: 900, margin: "auto", paddingBottom: "5rem" }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Edit Form
      </Typography>

      <TextField
        fullWidth
        label="Form Name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        multiline
        label="Form Description"
        value={formDescription}
        onChange={(e) => setFormDescription(e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormGroup
        sx={{ mb: 2, p: 1, border: "1px solid #ddd", borderRadius: 1 }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={allowAnonymous}
              onChange={(e) => setAllowAnonymous(e.target.checked)}
            />
          }
          label="Disable Anonymous Submissions"
        />
        <FormControlLabel
          control={
            <Switch
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
            />
          }
          label="Lock Form (prevents new answers)"
        />
      </FormGroup>

      <Typography variant="h5" sx={{ my: 2 }}>
        Questions
      </Typography>
      <div className="questions-section">
        {questions.map((q, index) => {
          const existingImgSrc = resolveQuestionImageSrc(q.questionImage);
          return (
            <div
              key={q.tempId}
              className="question-form"
              style={{
                border: q.isDirty
                  ? "1px solid #7b3fc4"
                  : "1px solid #ccc",
                padding: 16,
                borderRadius: 8,
                marginBottom: 16,
                background: q.isDirty ? "#faf5ff" : "#fff",
                transition: "border-color .3s, background .3s",
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <TextField
                  fullWidth
                  label={`Question ${index + 1}`}
                  value={q.questionText || ""}
                  onChange={(e) =>
                    handleUpdateQuestionLocal(
                      q.tempId,
                      "questionText",
                      e.target.value
                    )
                  }
                  sx={{ mr: 2 }}
                />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <Select
                  value={q.questionType || "short-text"}
                  onChange={(e) =>
                    handleUpdateQuestionLocal(
                      q.tempId,
                      "questionType",
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="short-text">Short Text</MenuItem>
                  <MenuItem value="long-text">Long Text</MenuItem>
                  <MenuItem value="multiple-choice-single">
                    Single Choice
                  </MenuItem>
                  <MenuItem value="multiple-choice-multiple">
                    Multiple Choice
                  </MenuItem>
                  <MenuItem value="numeric">Numeric</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="time">Time</MenuItem>
                </Select>
              </FormControl>

              {/* Image section */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Question Image
                </Typography>

                {q.localImageFile ? (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <img
                      src={q.localImagePreview || ""}
                      alt="New image preview"
                      style={{
                        maxWidth: 220,
                        maxHeight: 130,
                        borderRadius: 6,
                        objectFit: "contain",
                        border: "1px solid #eee",
                        background: "#fafafa",
                        padding: 4,
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        handleUpdateQuestionLocal(
                          q.tempId,
                          "localImageFile",
                          null
                        );
                        handleUpdateQuestionLocal(
                          q.tempId,
                          "localImagePreview",
                          null
                        );
                      }}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                ) : q.questionImage ? (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <img
                      src={existingImgSrc || ""}
                      alt="Existing question"
                      style={{
                        maxWidth: 220,
                        maxHeight: 130,
                        borderRadius: 6,
                        objectFit: "contain",
                        border: "1px solid #eee",
                        background: "#fafafa",
                        padding: 4,
                      }}
                      onError={(e) => {
                        const fallback = `${formsApiBase}${
                          q.questionImage?.startsWith("/") ? "" : "/"
                        }${q.questionImage || ""}`;
                        if (fallback && e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                    />
                    <Button variant="outlined" component="label">
                      Replace Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const preview = URL.createObjectURL(file);
                          handleUpdateQuestionLocal(
                            q.tempId,
                            "localImageFile",
                            file
                          );
                          handleUpdateQuestionLocal(
                            q.tempId,
                            "localImagePreview",
                            preview
                          );
                        }}
                      />
                    </Button>
                  </Box>
                ) : (
                  <Button variant="outlined" component="label" size="small">
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const preview = URL.createObjectURL(file);
                        handleUpdateQuestionLocal(
                          q.tempId,
                          "localImageFile",
                          file
                        );
                        handleUpdateQuestionLocal(
                          q.tempId,
                          "localImagePreview",
                          preview
                        );
                      }}
                    />
                  </Button>
                )}
              </Box>

              {(q.questionType === "multiple-choice-single" ||
                q.questionType === "multiple-choice-multiple") && (
                <div style={{ marginTop: 16 }}>
                  <Typography variant="subtitle2">Options</Typography>
                  {(q.options || []).map((opt, optIdx) => (
                    <Box
                      key={optIdx}
                      display="flex"
                      alignItems="center"
                      mb={1}
                    >
                      <TextField
                        placeholder={`Option ${optIdx + 1}`}
                        fullWidth
                        value={opt?.text ?? ""}
                        onChange={(e) => {
                          const options = Array.isArray(q.options)
                            ? [...q.options]
                            : [];
                          options[optIdx] = { text: e.target.value };
                          handleUpdateQuestionLocal(
                            q.tempId,
                            "options",
                            options
                          );
                        }}
                      />
                      <IconButton
                        onClick={() => {
                          const options = (q.options || []).filter(
                            (_, i) => i !== optIdx
                          );
                          handleUpdateQuestionLocal(
                            q.tempId,
                            "options",
                            options
                          );
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    onClick={() =>
                      handleUpdateQuestionLocal(q.tempId, "options", [
                        ...(q.options || []),
                        { text: "" },
                      ])
                    }
                  >
                    Add Option
                  </Button>
                </div>
              )}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={2}
                borderTop={1}
                borderColor="grey.300"
                pt={1}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!q.required}
                      onChange={(e) =>
                        handleUpdateQuestionLocal(
                          q.tempId,
                          "required",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Required"
                />
                <div>
                  <IconButton
                    title="Move Up"
                    disabled={index === 0}
                    onClick={() => handleMoveQuestion(index, "up")}
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    title="Move Down"
                    disabled={index === questions.length - 1}
                    onClick={() => handleMoveQuestion(index, "down")}
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                  {q._id ? (
                    <IconButton
                      title="Delete (from server)"
                      color="error"
                      onClick={() => handleDeleteExistingQuestion(q)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      title="Remove (local only)"
                      color="secondary"
                      onClick={() => handleRemoveNewQuestionLocal(q.tempId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </div>
              </Box>
            </div>
          );
        })}
      </div>

      {isCreator && (
        <Box
          sx={{
            my: 2,
            p: 2,
            border: "1px solid #7b3fc4",
            borderRadius: 1,
            display: "flex",
            gap: 2,
            background: "#faf5ff",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate(`/forms/menage/${formId}`)}
          >
            Manage Collaborators
          </Button>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate(`/forms/menage/${formId}`)}
          >
            Manage Observers
          </Button>
        </Box>
      )}

      <Button
        variant="outlined"
        color="primary"
        onClick={handleAddQuestionLocal}
        sx={{ mt: 2 }}
      >
        Add Question
      </Button>
      <Button
        variant="contained"
        color="success"
        onClick={handleSaveAll}
        disabled={isSaving}
        sx={{ mt: 2, ml: 2 }}
      >
        {isSaving ? <CircularProgress size={24} /> : "Save All Changes"}
      </Button>
    </div>
  );
}

export default EditFormPage;