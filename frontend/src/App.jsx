import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  Edit, 
  Trash2, 
  PlusCircle, 
  AlertTriangle, 
  ExternalLink, 
  FolderOpen, 
  Search, 
  X, 
  Loader2 
} from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://myowndsatracker-n8wu.vercel.app/api')
  : '/api';



function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    topic: 'all',
    difficulty: 'all',
    status: 'all'
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form States
  const [addForm, setAddForm] = useState({
    topic: '',
    name: '',
    link: '',
    difficulty: 'Medium'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    topic: '',
    name: '',
    link: '',
    difficulty: 'Medium'
  });

  // Toast Notification State
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Fetch all questions from database on mount
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/questions`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Compute stats reactively
  const stats = useMemo(() => {
    const total = questions.length;
    const solved = questions.filter(q => q.done).length;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    // Unique topics count
    const uniqueTopics = new Set(questions.map(q => q.topic));
    const totalTopics = uniqueTopics.size;

    // Difficulty breakdown
    const diffBreakdown = {
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 }
    };

    questions.forEach(q => {
      if (diffBreakdown[q.difficulty]) {
        diffBreakdown[q.difficulty].total++;
        if (q.done) {
          diffBreakdown[q.difficulty].solved++;
        }
      }
    });

    return {
      total,
      solved,
      percentage,
      totalTopics,
      topicsList: Array.from(uniqueTopics).sort(),
      difficulty: diffBreakdown
    };
  }, [questions]);

  // Toggle solved status
  const toggleQuestionStatus = async (id) => {
    const q = questions.find(item => item.id === id);
    if (!q) return;

    const newDoneState = !q.done;
    
    // Optimistic UI update
    setQuestions(prev => prev.map(item => item.id === id ? { ...item, done: newDoneState } : item));

    try {
      const response = await fetch(`${API_BASE}/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: newDoneState })
      });
      if (response.ok) {
        if (newDoneState) {
          showToast(`"${q.name}" marked as completed!`, "success");
        } else {
          showToast(`"${q.name}" marked as incomplete.`, "info");
        }
      } else {
        // Rollback on error
        setQuestions(prev => prev.map(item => item.id === id ? { ...item, done: !newDoneState } : item));
        showToast("Failed to update status on server.", "warning");
      }
    } catch (error) {
      console.error('Failed to update status on server:', error);
      // Rollback
      setQuestions(prev => prev.map(item => item.id === id ? { ...item, done: !newDoneState } : item));
      showToast("Failed to update status on server.", "warning");
    }
  };

  // Add question handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.topic.trim() || !addForm.name.trim() || !addForm.link.trim()) return;

    const newQuestion = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      topic: addForm.topic.trim(),
      name: addForm.name.trim(),
      link: addForm.link.trim(),
      difficulty: addForm.difficulty,
      done: false
    };

    try {
      const response = await fetch(`${API_BASE}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      if (response.ok) {
        setQuestions(prev => [...prev, newQuestion]);
        setIsAddModalOpen(false);
        setAddForm({ topic: '', name: '', link: '', difficulty: 'Medium' });
        showToast(`"${newQuestion.name}" added successfully!`, "success");
      } else {
        showToast("Failed to add question.", "warning");
      }
    } catch (error) {
      console.error('Error adding question:', error);
      showToast("Failed to add question.", "warning");
    }
  };

  // Open edit modal and populate data
  const handleEditClick = (q) => {
    setEditForm({
      id: q.id,
      topic: q.topic,
      name: q.name,
      link: q.link,
      difficulty: q.difficulty
    });
    setIsEditModalOpen(true);
  };

  // Edit question handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.topic.trim() || !editForm.name.trim() || !editForm.link.trim()) return;

    const updatedFields = {
      topic: editForm.topic.trim(),
      name: editForm.name.trim(),
      link: editForm.link.trim(),
      difficulty: editForm.difficulty
    };

    try {
      const response = await fetch(`${API_BASE}/questions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        setQuestions(prev => prev.map(item => item.id === editForm.id ? { ...item, ...updatedFields } : item));
        setIsEditModalOpen(false);
        showToast(`"${updatedFields.name}" updated successfully!`, "success");
      } else {
        showToast("Failed to update question.", "warning");
      }
    } catch (error) {
      console.error('Error editing question:', error);
      showToast("Failed to update question.", "warning");
    }
  };

  // Delete question handler
  const handleDeleteClick = async (q) => {
    if (!window.confirm(`Are you sure you want to delete "${q.name}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/questions/${q.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setQuestions(prev => prev.filter(item => item.id !== q.id));
        // Reset topic filter if that topic was completely deleted
        const remainingTopics = new Set(questions.filter(item => item.id !== q.id).map(item => item.topic));
        if (filters.topic !== 'all' && !remainingTopics.has(filters.topic)) {
          setFilters(prev => ({ ...prev, topic: 'all' }));
        }
        showToast(`"${q.name}" has been deleted.`, "warning");
      } else {
        showToast("Failed to delete question.", "warning");
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      showToast("Failed to delete question.", "warning");
    }
  };

  // Reset progress handler
  const handleResetConfirm = async () => {
    try {
      const response = await fetch(`${API_BASE}/questions/reset`, {
        method: 'POST'
      });
      if (response.ok) {
        setQuestions(prev => prev.map(q => ({ ...q, done: false })));
        setIsResetModalOpen(false);
        showToast("All progress has been reset.", "info");
      } else {
        showToast("Failed to reset progress.", "warning");
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      showToast("Failed to reset progress.", "warning");
    }
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const searchLower = filters.search.toLowerCase();
    
    const filtered = questions.filter(q => {
      const matchesSearch = q.name.toLowerCase().includes(searchLower) || q.topic.toLowerCase().includes(searchLower);
      const matchesTopic = filters.topic === 'all' || q.topic === filters.topic;
      const matchesDifficulty = filters.difficulty === 'all' || q.difficulty === filters.difficulty;
      const matchesStatus = filters.status === 'all' || 
                            (filters.status === 'solved' && q.done) || 
                            (filters.status === 'unsolved' && !q.done);
      return matchesSearch && matchesTopic && matchesDifficulty && matchesStatus;
    });

    // Sort questions: original numeric order first, custom string keys at the end
    return filtered.sort((a, b) => {
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      if (!isNaN(idA) && !isNaN(idB)) {
        return idA - idB;
      }
      if (isNaN(idA) && !isNaN(idB)) return 1;
      if (!isNaN(idA) && isNaN(idB)) return -1;
      return a.id.localeCompare(b.id);
    });
  }, [questions, filters]);

  // SVG Circle Stroke offset calculation
  const circleCircumference = 2 * Math.PI * 34; // r=34
  const strokeDashoffset = circleCircumference - (stats.percentage / 100) * circleCircumference;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-group">
              <span className="logo-badge">PRO</span>
              <h1>LeetTracker</h1>
            </div>
            <div className="header-meta">
              <div className="meta-item">
                <span className="meta-label">Total Questions</span>
                <span className="meta-val">{stats.total}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Topics Available</span>
                <span className="meta-val">{stats.totalTopics}</span>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="progress-radial-wrapper">
              <div className="radial-svg-container">
                <svg viewBox="0 0 80 80">
                  <circle className="circle-bg" cx="40" cy="40" r="34" />
                  <circle 
                    className="circle-fill" 
                    cx="40" 
                    cy="40" 
                    r="34" 
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="radial-label-inner">
                  <span className="radial-percent">{stats.percentage}%</span>
                  <span className="radial-sub">SOLVED</span>
                </div>
              </div>
              <div className="progress-details">
                <span className="progress-fraction">{stats.solved} / {stats.total} Done</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="main-content">
        {/* Difficulty stats panel */}
        <section className="stats-dashboard">
          <div className="stat-progress-card difficulty-easy">
            <div className="card-top">
              <span className="card-title">Easy Difficulty</span>
              <span className="card-stats">{stats.difficulty.Easy.solved} / {stats.difficulty.Easy.total}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${stats.difficulty.Easy.total > 0 ? (stats.difficulty.Easy.solved / stats.difficulty.Easy.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-progress-card difficulty-medium">
            <div className="card-top">
              <span className="card-title">Medium Difficulty</span>
              <span className="card-stats">{stats.difficulty.Medium.solved} / {stats.difficulty.Medium.total}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${stats.difficulty.Medium.total > 0 ? (stats.difficulty.Medium.solved / stats.difficulty.Medium.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-progress-card difficulty-hard">
            <div className="card-top">
              <span className="card-title">Hard Difficulty</span>
              <span className="card-stats">{stats.difficulty.Hard.solved} / {stats.difficulty.Hard.total}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${stats.difficulty.Hard.total > 0 ? (stats.difficulty.Hard.solved / stats.difficulty.Hard.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <section className="board-toolbar">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search question name or topic..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="filter-options">
            <select 
              value={filters.topic}
              onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
              className="custom-select"
            >
              <option value="all">All Topics</option>
              {stats.topicsList.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select 
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="custom-select"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select 
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="custom-select"
            >
              <option value="all">All Statuses</option>
              <option value="solved">Solved</option>
              <option value="unsolved">Unsolved</option>
            </select>

            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="mini-icon" size={16} /> Add Question
            </button>

            <button className="btn btn-secondary text-danger-hover" onClick={() => setIsResetModalOpen(true)}>
              Reset Progress
            </button>
          </div>
        </section>

        {/* Board View */}
        <section className="topics-grid">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={32} />
              <p>Initializing LeetTracker Board...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <FolderOpen className="empty-state-icon" size={48} />
              <h3>No questions found</h3>
              <p>Try resetting filters or adding a new question to this board.</p>
            </div>
          ) : (
            <div className="questions-table-container">
              <div className="questions-table-header">
                <div className="col-status">Status</div>
                <div className="col-title">Title</div>
                <div className="col-topic">Topic</div>
                <div className="col-difficulty">Difficulty</div>
                <div className="col-action">Action</div>
              </div>
              <div className="questions-table-body">
                {filteredQuestions.map((q) => (
                  <div key={q.id} className={`question-row difficulty-${q.difficulty.toLowerCase()} ${q.done ? 'solved' : ''}`}>
                    <div className="col-status">
                      <button className="btn-done-toggle" onClick={() => toggleQuestionStatus(q.id)}>
                        <Check size={12} strokeWidth={4} />
                      </button>
                    </div>
                    
                    <div className="col-title">
                      <a 
                        href={q.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="question-link"
                        title={`Solve '${q.name}' on LeetCode`}
                      >
                        <span>{q.name}</span>
                        <ExternalLink className="question-link-icon" size={14} />
                      </a>
                    </div>
                    
                    <div className="col-topic">
                      <span className="topic-badge">{q.topic}</span>
                    </div>
                    
                    <div className="col-difficulty">
                      <span className={`diff-badge ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                    </div>
                    
                    <div className="col-action">
                      <button className="btn-edit" title="Edit this question" onClick={() => handleEditClick(q)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-delete" title="Delete this question" onClick={() => handleDeleteClick(q)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <p>&copy; 2026 LeetTracker. Engineered for Elite Developers.</p>
          <div className="footer-links">
            <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mini-icon" size={12} /> LeetCode Website
            </a>
          </div>
        </div>
      </footer>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <PlusCircle className="modal-header-icon text-accent" size={24} />
                <h2>Add New Question</h2>
              </div>
              <button className="modal-close btn-close-modal" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="input-topic">Topic Name</label>
                  <input 
                    type="text" 
                    id="input-topic" 
                    placeholder="e.g., Arrays & Hashing, Trees..." 
                    required 
                    list="existing-topics-react"
                    value={addForm.topic}
                    onChange={(e) => setAddForm(prev => ({ ...prev, topic: e.target.value }))}
                  />
                  <datalist id="existing-topics-react">
                    {stats.topicsList.map(topic => (
                      <option key={topic} value={topic} />
                    ))}
                  </datalist>
                  <span className="input-helper">Select an existing topic or type a new one.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="input-name">Question Title</label>
                  <input 
                    type="text" 
                    id="input-name" 
                    placeholder="e.g., Two Sum, Reverse Linked List" 
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="input-link">Question Link (URL)</label>
                  <input 
                    type="url" 
                    id="input-link" 
                    placeholder="https://leetcode.com/problems/..." 
                    required
                    value={addForm.link}
                    onChange={(e) => setAddForm(prev => ({ ...prev, link: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="input-difficulty">Difficulty</label>
                  <select 
                    id="input-difficulty" 
                    className="custom-select" 
                    required
                    value={addForm.difficulty}
                    onChange={(e) => setAddForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <Edit className="modal-header-icon text-accent" size={24} />
                <h2>Edit Question</h2>
              </div>
              <button className="modal-close btn-close-modal" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-topic">Topic Name</label>
                  <input 
                    type="text" 
                    id="edit-topic" 
                    placeholder="e.g., Arrays & Hashing, Trees..." 
                    required 
                    list="existing-topics-react"
                    value={editForm.topic}
                    onChange={(e) => setEditForm(prev => ({ ...prev, topic: e.target.value }))}
                  />
                  <span className="input-helper">Select an existing topic or type a new one.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-name">Question Title</label>
                  <input 
                    type="text" 
                    id="edit-name" 
                    placeholder="e.g., Two Sum, Reverse Linked List" 
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-link">Question Link (URL)</label>
                  <input 
                    type="url" 
                    id="edit-link" 
                    placeholder="https://leetcode.com/problems/..." 
                    required
                    value={editForm.link}
                    onChange={(e) => setEditForm(prev => ({ ...prev, link: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-difficulty">Difficulty</label>
                  <select 
                    id="edit-difficulty" 
                    className="custom-select" 
                    required
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="modal-overlay active">
          <div className="modal-card modal-confirm-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <AlertTriangle className="modal-header-icon text-danger" size={24} />
                <h2>Reset All Progress?</h2>
              </div>
              <button className="modal-close btn-close-modal" onClick={() => setIsResetModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>This action will reset your progress back to unsolved for all questions in the database.</p>
              <p className="warning-text">Note: This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsResetModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleResetConfirm}>Yes, Reset Progress</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Container */}
      <div className="toasts-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            <div className="toast-icon">
              {t.type === 'success' && <Check size={14} />}
              {t.type === 'info' && <ExternalLink size={14} />}
              {t.type === 'warning' && <AlertTriangle size={14} />}
            </div>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
