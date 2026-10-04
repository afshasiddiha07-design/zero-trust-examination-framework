import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  ScrollText,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
} from "lucide-react";
import api from "./api";


// =========================
// LOGIN
// =========================

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem("access_token", response.data.access_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <ShieldCheck size={34} />
        </div>

        <h1>Zero-Trust Examination</h1>
        <p>Secure Examination Management Portal</p>

        <form onSubmit={handleLogin}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button className="primary-button full-width" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}


// =========================
// QUESTION FORM
// =========================

function QuestionForm({ question, onClose, onSaved }) {
  const isEditing = Boolean(question);

  const [form, setForm] = useState({
    question_text: question?.question_text || "",
    option_a: question?.option_a || "",
    option_b: question?.option_b || "",
    option_c: question?.option_c || "",
    option_d: question?.option_d || "",
    correct_answer: question?.correct_answer || "A",
    subject: question?.subject || "",
    difficulty: question?.difficulty || "Medium",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (isEditing) {
        await api.put(`/questions/${question.id}`, form);
      } else {
        await api.post("/questions/", form);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Edit Question" : "Add Question"}</h2>
            <p>
              {isEditing
                ? "Update the question bank entry."
                : "Add a question to the secure question bank."}
            </p>
          </div>

          <button className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Question</label>
          <textarea
            value={form.question_text}
            onChange={(e) => updateField("question_text", e.target.value)}
            placeholder="Enter question"
            required
          />

          <div className="form-grid">
            <div>
              <label>Option A</label>
              <input
                value={form.option_a}
                onChange={(e) => updateField("option_a", e.target.value)}
                required
              />
            </div>

            <div>
              <label>Option B</label>
              <input
                value={form.option_b}
                onChange={(e) => updateField("option_b", e.target.value)}
                required
              />
            </div>

            <div>
              <label>Option C</label>
              <input
                value={form.option_c}
                onChange={(e) => updateField("option_c", e.target.value)}
                required
              />
            </div>

            <div>
              <label>Option D</label>
              <input
                value={form.option_d}
                onChange={(e) => updateField("option_d", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label>Correct Answer</label>
              <select
                value={form.correct_answer}
                onChange={(e) =>
                  updateField("correct_answer", e.target.value)
                }
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div>
              <label>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                placeholder="e.g. DBMS"
                required
              />
            </div>

            <div>
              <label>Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="primary-button" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Question" : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// =========================
// QUESTION BANK
// =========================

function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const loadQuestions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/questions/");
      setQuestions(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/questions/${id}`);
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not delete question");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Question Bank</h1>
          <p>Manage secure examination questions.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setEditingQuestion(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-card">
        <div className="card-toolbar">
          <div>
            <strong>{questions.length}</strong> question
            {questions.length !== 1 ? "s" : ""} in question bank
          </div>

          <button className="secondary-button" onClick={loadQuestions}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="empty-state">
            No questions available. Add your first question.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Question</th>
                  <th>Subject</th>
                  <th>Difficulty</th>
                  <th>Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td>#{question.id}</td>

                    <td className="question-cell">
                      {question.question_text}
                    </td>

                    <td>
                      <span className="badge subject-badge">
                        {question.subject}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${question.difficulty.toLowerCase()}`}>
                        {question.difficulty}
                      </span>
                    </td>

                    <td>
                      <strong>{question.correct_answer}</strong>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Edit"
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowForm(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="icon-button danger-icon"
                          title="Delete"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <QuestionForm
          question={editingQuestion}
          onClose={() => setShowForm(false)}
          onSaved={loadQuestions}
        />
      )}
    </div>
  );
}


// =========================
// JIT EXAM GENERATOR
// =========================

function ExamGenerator() {
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [generatedExam, setGeneratedExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateExam = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setGeneratedExam(null);

    try {
      const response = await api.post("/questions/generate", {
        number_of_questions: Number(numberOfQuestions),
        subject: subject.trim() || null,
        difficulty: difficulty || null,
      });

      setGeneratedExam(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not generate examination"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!generatedExam?.exam_id) return;

    try {
      const response = await api.get(
        `/questions/exams/${generatedExam.exam_id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `exam_${generatedExam.exam_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError("Could not download examination PDF");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>JIT Exam Generator</h1>
          <p>
            Generate a randomized examination just before deployment.
          </p>
        </div>
      </div>

      <div className="generator-layout">
        <div className="content-card generator-card">
          <div className="section-icon">
            <ClipboardCheck size={24} />
          </div>

          <h2>Generate New Examination</h2>

          <p className="section-description">
            Questions are selected from the secure question bank using
            the requested filters. A unique exam ID and integrity hash
            are generated for the exam.
          </p>

          <form onSubmit={generateExam}>
            <label>Number of Questions</label>

            <input
              type="number"
              min="1"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(e.target.value)}
              required
            />

            <label>Subject Filter</label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Leave empty for all subjects"
            />

            <label>Difficulty Filter</label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">All difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            {error && <div className="error-message">{error}</div>}

            <button
              className="primary-button full-width"
              disabled={loading}
            >
              <ClipboardCheck size={18} />

              {loading
                ? "Generating Examination..."
                : "Generate JIT Examination"}
            </button>
          </form>
        </div>

        <div className="content-card architecture-card">
          <h2>JIT Security Flow</h2>

          <div className="flow-step">
            <span>1</span>
            <div>
              <strong>Filter</strong>
              <p>Apply subject and difficulty constraints.</p>
            </div>
          </div>

          <div className="flow-step">
            <span>2</span>
            <div>
              <strong>Randomize</strong>
              <p>Select questions using secure random sampling.</p>
            </div>
          </div>

          <div className="flow-step">
            <span>3</span>
            <div>
              <strong>Hash</strong>
              <p>Create an integrity hash for the generated exam.</p>
            </div>
          </div>

          <div className="flow-step">
            <span>4</span>
            <div>
              <strong>Audit</strong>
              <p>Record the generation event in the audit chain.</p>
            </div>
          </div>

          <div className="flow-step">
            <span>5</span>
            <div>
              <strong>PDF</strong>
              <p>Create the final examination document.</p>
            </div>
          </div>
        </div>
      </div>

      {generatedExam && (
        <div className="content-card generated-exam-card">
          <div className="generated-header">
            <div>
              <span className="success-label">
                Examination Generated
              </span>

              <h2>JIT Examination Ready</h2>
            </div>

            <button
              className="primary-button"
              onClick={downloadPdf}
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>

          <div className="exam-metadata">
            <div>
              <span>Exam ID</span>
              <strong className="mono">
                {generatedExam.exam_id}
              </strong>
            </div>

            <div>
              <span>Questions</span>
              <strong>{generatedExam.number_of_questions}</strong>
            </div>

            <div>
              <span>Generated At</span>
              <strong>
                {new Date(
                  generatedExam.generated_at
                ).toLocaleString()}
              </strong>
            </div>

            <div className="hash-box">
              <span>Integrity Hash</span>
              <strong className="mono">
                {generatedExam.integrity_hash}
              </strong>
            </div>
          </div>

          <div className="exam-questions">
            <h3>Generated Question Set</h3>

            {generatedExam.questions?.map((question, index) => (
              <div className="generated-question" key={question.id}>
                <div className="question-number">
                  {index + 1}
                </div>

                <div className="generated-question-content">
                  <strong>{question.question_text}</strong>

                  <div className="options-grid">
                    <span>A. {question.option_a}</span>
                    <span>B. {question.option_b}</span>
                    <span>C. {question.option_c}</span>
                    <span>D. {question.option_d}</span>
                  </div>

                  <div className="question-meta">
                    <span>{question.subject}</span>
                    <span>{question.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// =========================
// GENERATED EXAMS
// =========================

function GeneratedExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExams = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/questions/exams");
      setExams(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const downloadPdf = async (examId) => {
    try {
      const response = await api.get(
        `/questions/exams/${examId}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `exam_${examId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Could not download PDF");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Generated Examinations</h1>
          <p>Previously generated JIT examination records.</p>
        </div>

        <button className="secondary-button" onClick={loadExams}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-card">
        {loading ? (
          <div className="empty-state">Loading examinations...</div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            No examinations have been generated yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Exam ID</th>
                  <th>Questions</th>
                  <th>Generated At</th>
                  <th>Integrity Hash</th>
                  <th>PDF</th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="mono">
                      {exam.exam_id}
                    </td>

                    <td>{exam.number_of_questions}</td>

                    <td>
                      {new Date(
                        exam.generated_at
                      ).toLocaleString()}
                    </td>

                    <td>
                      <span className="hash-short mono">
                        {exam.integrity_hash}
                      </span>
                    </td>

                    <td>
                      <button
                        className="icon-button"
                        title="Download PDF"
                        onClick={() =>
                          downloadPdf(exam.exam_id)
                        }
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// =========================
// SECURITY MONITOR
// =========================

function SecurityMonitor() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Security Monitor</h1>
          <p>AI-assisted examination environment monitoring.</p>
        </div>
      </div>

      <div className="security-grid">
        <div className="content-card security-status-card">
          <div className="section-icon">
            <ShieldCheck size={24} />
          </div>

          <h2>AI Security Monitor</h2>

          <p>
            The computer-vision monitor runs separately from the
            examination portal and reports detected security incidents
            to the backend.
          </p>

          <div className="status-indicator">
            <span className="status-dot"></span>
            Monitor Component
          </div>
        </div>

        <div className="content-card">
          <h2>Current Detection Scope</h2>

          <div className="security-feature">
            <strong>📱 Unauthorized Phone Detection</strong>
            <span>Implemented</span>
          </div>

          <div className="security-feature">
            <strong>Computer Vision</strong>
            <span>YOLO-based</span>
          </div>

          <div className="security-feature">
            <strong>Incident Reporting</strong>
            <span>FastAPI</span>
          </div>

          <div className="security-feature">
            <strong>Audit Recording</strong>
            <span>Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// =========================
// AUDIT LOGS
// =========================

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verification, setVerification] = useState(null);

  const loadLogs = async () => {
    setLoading(true);

    try {
      const response = await api.get("/questions/audit-logs");
      setLogs(response.data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    try {
      const response = await api.get(
        "/questions/audit-logs/verify"
      );
      setVerification(response.data);
    } catch {
      setVerification({
        valid: false,
        message: "Could not verify audit chain",
      });
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Review security-sensitive examination events.</p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={loadLogs}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="primary-button"
            onClick={verifyChain}
          >
            <ShieldCheck size={16} />
            Verify Chain
          </button>
        </div>
      </div>

      {verification && (
        <div
          className={`verification-banner ${
            verification.valid ? "valid" : "invalid"
          }`}
        >
          <ShieldCheck size={20} />

          <div>
            <strong>
              {verification.valid
                ? "Audit Chain Valid"
                : "Audit Chain Invalid"}
            </strong>

            <p>{verification.message}</p>
          </div>
        </div>
      )}

      <div className="content-card">
        {loading ? (
          <div className="empty-state">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            No audit logs available.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td>{log.username}</td>
                    <td>
                      <span className="badge subject-badge">
                        {log.action}
                      </span>
                    </td>
                    <td>{log.details}</td>
                    <td>
                      {new Date(
                        log.timestamp
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


// =========================
// DASHBOARD
// =========================

function Dashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch {
        onLogout();
      }
    };

    loadUser();
  }, [onLogout]);

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: ClipboardCheck,
    },
    {
      id: "questions",
      label: "Question Bank",
      icon: BookOpen,
    },
    {
      id: "generator",
      label: "JIT Generator",
      icon: FileText,
    },
    {
      id: "exams",
      label: "Generated Exams",
      icon: ScrollText,
    },
    {
      id: "security",
      label: "Security Monitor",
      icon: ShieldCheck,
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: ScrollText,
    },
  ];

  const renderPage = () => {
    switch (activePage) {
      case "questions":
        return <QuestionBank />;

      case "generator":
        return <ExamGenerator />;

      case "exams":
        return <GeneratedExams />;

      case "security":
        return <SecurityMonitor />;

      case "audit":
        return <AuditLogs />;

      default:
        return (
          <div>
            <div className="page-header">
              <div>
                <h1>Security Dashboard</h1>
                <p>
                  Zero-Trust Examination Framework control center.
                </p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <BookOpen size={22} />
                </div>
                <span>Question Management</span>
                <strong>Active</strong>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <ClipboardCheck size={22} />
                </div>
                <span>JIT Generation</span>
                <strong>Enabled</strong>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <ShieldCheck size={22} />
                </div>
                <span>AI Security Monitor</span>
                <strong>Connected</strong>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <ScrollText size={22} />
                </div>
                <span>Audit Chain</span>
                <strong>Protected</strong>
              </div>
            </div>

            <div className="content-card dashboard-intro">
              <div className="section-icon">
                <ShieldCheck size={24} />
              </div>

              <h2>Zero-Trust Examination Lifecycle</h2>

              <p>
                This portal manages the secure examination lifecycle
                from question-bank administration through just-in-time
                exam generation, integrity verification, security
                monitoring, and audit logging.
              </p>

              <div className="lifecycle-grid">
                <div>
                  <span>01</span>
                  <strong>Authenticate</strong>
                  <p>JWT-based admin authentication.</p>
                </div>

                <div>
                  <span>02</span>
                  <strong>Prepare</strong>
                  <p>Maintain the secure question bank.</p>
                </div>

                <div>
                  <span>03</span>
                  <strong>Generate</strong>
                  <p>Create a randomized exam just-in-time.</p>
                </div>

                <div>
                  <span>04</span>
                  <strong>Verify</strong>
                  <p>Protect integrity with hashing and audit logs.</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <ShieldCheck size={23} />
          </div>

          <div>
            <strong>Zero-Trust</strong>
            <span>Examination Framework</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={
                  activePage === item.id
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="security-label">
            <span className="status-dot"></span>
            Secure Session
          </div>

          <button className="logout-button" onClick={onLogout}>
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <strong>Examination Administration</strong>
          </div>

          <div className="user-info">
            <div className="avatar">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>

            <div>
              <strong>{user?.username || "Admin"}</strong>
              <span>{user?.role || "EXAM_ADMIN"}</span>
            </div>
          </div>
        </header>

        <div className="page-content">{renderPage()}</div>
      </main>
    </div>
  );
}


// =========================
// APP
// =========================

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("access_token"))
  );

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Login
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return <Dashboard onLogout={handleLogout} />;
}

export default App;