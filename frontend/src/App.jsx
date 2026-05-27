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
  Loader2,
  LogOut,
  User,
  Key,
  Shield,
  Sparkles,
  Code,
  Award,
  Terminal,
  Menu,
  Folder,
  List,
  ArrowLeft
} from 'lucide-react';
import './App.css';
import { baseURL } from './config';

function App() {
  // Authentication & Navigation State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [currentView, setCurrentView] = useState(localStorage.getItem('token') ? 'dashboard' : 'landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth Form State
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // LeetTracker Board State
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    topic: 'all',
    difficulty: 'all',
    status: 'all',
    revisionSort: 'none'
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'folder'
  const [activeFolder, setActiveFolder] = useState(null); // name of active topic folder

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

  // Fetch questions for authenticated user
  const fetchQuestions = async (activeToken) => {
    const targetToken = activeToken || token;
    if (!targetToken) return;

    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/api/questions`, {
        headers: {
          'Authorization': `Bearer ${targetToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        showToast("Session expired. Please log in again.", "warning");
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      showToast("Could not retrieve questions. Server connection error.", "warning");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount/token change
  useEffect(() => {
    if (token) {
      fetchQuestions(token);
    }
  }, [token]);

  // Auth Handlers
  const handleAuthSubmit = async (e, type) => {
    e.preventDefault();
    setAuthError('');

    if (!authForm.username.trim() || !authForm.password) {
      setAuthError('All fields are required.');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = type === 'login' ? 'login' : 'signup';
      const response = await fetch(`${baseURL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: authForm.username.trim(),
          password: authForm.password
        })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user.username);
        setToken(data.token);
        setUsername(data.user.username);
        setAuthForm({ username: '', password: '' });
        setCurrentView('dashboard');
        showToast(
          type === 'login'
            ? `Welcome back, ${data.user.username}!`
            : `Account created successfully! Welcome, ${data.user.username}!`,
          "success"
        );
      } else {
        setAuthError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthError('Connection failed. Please check if the server is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
    setQuestions([]);
    setCurrentView('landing');
    setIsMobileMenuOpen(false);
    showToast("Logged out successfully.", "info");
  };

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
      const response = await fetch(`${baseURL}/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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

  // Update revisions counter
  const handleUpdateRevisions = async (id, newRevisionsVal) => {
    if (newRevisionsVal < 0) return;
    const q = questions.find(item => item.id === id);
    if (!q) return;

    const oldRevisions = q.revisions || 0;

    // Optimistic UI update
    setQuestions(prev => prev.map(item => item.id === id ? { ...item, revisions: newRevisionsVal } : item));

    try {
      const response = await fetch(`${baseURL}/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ revisions: newRevisionsVal })
      });
      if (response.ok) {
        showToast(`Updated revisions for "${q.name}" to ${newRevisionsVal}.`, "success");
      } else {
        // Rollback
        setQuestions(prev => prev.map(item => item.id === id ? { ...item, revisions: oldRevisions } : item));
        showToast("Failed to update revisions on server.", "warning");
      }
    } catch (error) {
      console.error('Failed to update revisions:', error);
      // Rollback
      setQuestions(prev => prev.map(item => item.id === id ? { ...item, revisions: oldRevisions } : item));
      showToast("Failed to update revisions on server.", "warning");
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
      const response = await fetch(`${baseURL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newQuestion)
      });
      if (response.ok) {
        const responseData = await response.json();
        setQuestions(prev => [...prev, responseData.question || newQuestion]);
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
      const response = await fetch(`${baseURL}/api/questions/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const response = await fetch(`${baseURL}/api/questions/${q.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setQuestions(prev => prev.filter(item => item.id !== q.id));
        // Reset topic filter if that topic was completely deleted
        const remainingTopics = new Set(questions.filter(item => item.id !== q.id).map(item => item.topic));
        if (filters.topic !== 'all' && !remainingTopics.has(filters.topic)) {
          setFilters(prev => ({ ...prev, topic: 'all' }));
        }
        if (activeFolder && !remainingTopics.has(activeFolder)) {
          setActiveFolder(null);
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
      const response = await fetch(`${baseURL}/api/questions/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

    // Sort questions: by revision (if selected) or original numeric/string order
    return filtered.sort((a, b) => {
      if (filters.revisionSort === 'asc') {
        const revA = a.revisions || 0;
        const revB = b.revisions || 0;
        if (revA !== revB) {
          return revA - revB;
        }
      } else if (filters.revisionSort === 'desc') {
        const revA = a.revisions || 0;
        const revB = b.revisions || 0;
        if (revA !== revB) {
          return revB - revA;
        }
      }

      // Default sorting: original numeric order first, custom string keys at the end
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

  // Grouped questions data for Folders View, responsive to filters
  const foldersData = useMemo(() => {
    const folders = {};
    filteredQuestions.forEach(q => {
      if (!folders[q.topic]) {
        folders[q.topic] = {
          name: q.topic,
          total: 0,
          solved: 0,
          easy: 0,
          medium: 0,
          hard: 0
        };
      }
      folders[q.topic].total++;
      if (q.done) {
        folders[q.topic].solved++;
      }
      if (q.difficulty === 'Easy') folders[q.topic].easy++;
      else if (q.difficulty === 'Medium') folders[q.topic].medium++;
      else if (q.difficulty === 'Hard') folders[q.topic].hard++;
    });
    return Object.values(folders).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredQuestions]);

  // Questions to render in the table (all filtered questions or just the ones in active folder)
  const questionsToRender = useMemo(() => {
    if (viewMode === 'folder' && activeFolder) {
      return filteredQuestions.filter(q => q.topic === activeFolder);
    }
    return filteredQuestions;
  }, [filteredQuestions, viewMode, activeFolder]);

  // SVG Circle Stroke offset calculation
  const circleCircumference = 2 * Math.PI * 34; // r=34
  const strokeDashoffset = circleCircumference - (stats.percentage / 100) * circleCircumference;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-group" onClick={() => !token && setCurrentView('landing')} style={{ cursor: !token ? 'pointer' : 'default' }}>
              <h1>LeetTracker</h1>
            </div>

            {token && currentView === 'dashboard' && (
              <div className="header-meta desktop-only">
                <div className="meta-item">
                  <span className="meta-label">Total Questions</span>
                  <span className="meta-val">{stats.total}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Topics Available</span>
                  <span className="meta-val">{stats.totalTopics}</span>
                </div>
              </div>
            )}
          </div>

          <div className="header-right">
            <div className="desktop-nav">
              {token && currentView === 'dashboard' ? (
                <div className="header-user-info">
                  {/* Progress Circle */}
                  <div className="progress-radial-wrapper" style={{ marginRight: '1rem' }}>
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

                  <span className="username-display">@{username}</span>
                  <button className="btn-logout" onClick={handleLogout} title="Log out from LeetTracker">
                    <LogOut size={14} style={{ marginRight: '0.4rem' }} /> Log Out
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('login'); }}>
                    Sign In
                  </button>
                  <button className="btn btn-primary" onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('signup'); }}>
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Toggle Button */}
            <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className="drawer-content">
          <div className="drawer-header">
            <div className="logo-group">
              <h1>LeetTracker</h1>
            </div>
            <button className="btn-close-drawer" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <div className="drawer-body">
            {token && currentView === 'dashboard' ? (
              <div className="drawer-user-section">
                <div className="drawer-user-meta">
                  <span className="username-display">@{username}</span>
                </div>

                {/* Progress Circle in Drawer */}
                <div className="progress-radial-wrapper drawer-progress">
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

                <div className="drawer-stats">
                  <div className="meta-item">
                    <span className="meta-label">Total Questions</span>
                    <span className="meta-val">{stats.total}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Topics Available</span>
                    <span className="meta-val">{stats.totalTopics}</span>
                  </div>
                </div>

                <button className="btn btn-danger btn-logout-drawer" onClick={handleLogout} style={{ width: '100%', marginTop: '2rem' }}>
                  <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Log Out
                </button>
              </div>
            ) : (
              <div className="drawer-auth-actions">
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('login'); setIsMobileMenuOpen(false); }}>
                  Sign In
                </button>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('signup'); setIsMobileMenuOpen(false); }}>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      {currentView === 'landing' && (
        <div className="landing-container">
          <section className="landing-hero">

            <h2 className="landing-title">Build Your Curated DSA Study Plan</h2>
            <p className="landing-subtitle">
              A premium, high-performance web dashboard built for students and professionals to build custom DSA sheets, track revision progress, and enable lightning-fast lookups.
            </p>
            <div className="landing-actions">
              <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }} onClick={() => setCurrentView('signup')}>
                Get Started
              </button>
              <button className="btn btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }} onClick={() => setCurrentView('login')}>
                Sign In to Account
              </button>
            </div>
          </section>

          <section className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Terminal size={24} />
              </div>
              <h3>Curate Custom Lists</h3>
              <p>Add your own selected questions, organize them into topics, and build the perfect personal roadmap for your revision goals.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Award size={24} />
              </div>
              <h3>Progress Isolation</h3>
              <p>Create a secure account to track your individual solving progress, update difficulty details, and add custom entries.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Code size={24} />
              </div>
              <h3>Analytical Metrics</h3>
              <p>Visualize your progress through interactive charts, easy/medium/hard progress bars, and percentage gauges.</p>
            </div>
          </section>
        </div>
      )}

      {(currentView === 'login' || currentView === 'signup') && (
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h2>{currentView === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p>
                {currentView === 'login'
                  ? 'Sign in to access your custom DSA sheet progress.'
                  : 'Start tracking your LeetCode goals with isolated metrics.'}
              </p>
            </div>

            <form className="auth-form" onSubmit={(e) => handleAuthSubmit(e, currentView)}>
              {authError && <div className="auth-error">{authError}</div>}

              <div className="form-group">
                <label htmlFor="auth-username">Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    id="auth-username"
                    placeholder="Enter your username"
                    required
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    value={authForm.username}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="auth-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    id="auth-password"
                    placeholder="Enter your password (min 6 chars)"
                    required
                    style={{ paddingLeft: '2.5rem', width: '100%' }}
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Key size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={authLoading}>
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="spinner" /> Authenticating...
                  </>
                ) : (
                  currentView === 'login' ? 'Access Dashboard' : 'Generate Account'
                )}
              </button>
            </form>

            <div className="auth-footer">
              {currentView === 'login' ? (
                <>
                  New to LeetTracker?
                  <span className="auth-link" onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('signup'); }}>
                    Create Account
                  </span>
                </>
              ) : (
                <>
                  Already registered?
                  <span className="auth-link" onClick={() => { setAuthError(''); setAuthForm({ username: '', password: '' }); setCurrentView('login'); }}>
                    Log In
                  </span>
                </>
              )}
              <div style={{ marginTop: '1.25rem' }}>
                <span className="auth-link" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }} onClick={() => setCurrentView('landing')}>
                  ← Back to Home
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === 'dashboard' && (
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

          {/* Search Bar Row */}
          <div className="search-section">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search question name or topic..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          {/* Toolbar & Filters */}
          <section className="board-toolbar">
            <div className="filter-options">
              <div className="filter-left-group">
                {/* View Toggle Mode */}
                <div className="view-toggle-buttons">
                  <button
                    className={`btn-toggle ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => { setViewMode('table'); setActiveFolder(null); }}
                    title="List View"
                  >
                    <List size={14} />
                    <span>List</span>
                  </button>
                  <button
                    className={`btn-toggle ${viewMode === 'folder' ? 'active' : ''}`}
                    onClick={() => { setViewMode('folder'); setActiveFolder(null); }}
                    title="Folder View"
                  >
                    <Folder size={14} />
                    <span>Folders</span>
                  </button>
                </div>

                {viewMode !== 'folder' && (
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
                )}

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

                <select
                  value={filters.revisionSort}
                  onChange={(e) => setFilters(prev => ({ ...prev, revisionSort: e.target.value }))}
                  className="custom-select"
                >
                  <option value="none">Sort by Revisions</option>
                  <option value="asc">Revisions: Low to High</option>
                  <option value="desc">Revisions: High to Low</option>
                </select>
              </div>

              <div className="filter-right-group">
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  <PlusCircle className="mini-icon" size={16} /> Add Question
                </button>

                <button className="btn btn-secondary text-danger-hover" onClick={() => setIsResetModalOpen(true)}>
                  Reset Progress
                </button>
              </div>
            </div>
          </section>

          {/* Board View */}
          <section className="topics-grid">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="spinner" size={32} />
                <p>Initializing LeetTracker Board...</p>
              </div>
            ) : filteredQuestions.length === 0 && viewMode === 'table' ? (
              <div className="empty-state">
                <FolderOpen className="empty-state-icon" size={48} />
                <h3>Your DSA revision sheet is empty</h3>
                <p>Start curating your personal DSA roadmap by clicking the "Add Question" button above.</p>
              </div>
            ) : viewMode === 'folder' && !activeFolder ? (
              /* Render Folders Grid */
              foldersData.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen className="empty-state-icon" size={48} />
                  <h3>Your DSA revision sheet is empty</h3>
                  <p>Start curating your personal DSA roadmap by clicking the "Add Question" button above.</p>
                </div>
              ) : (
                <div className="folders-grid">
                  {foldersData.map(folder => {
                    const percent = folder.total > 0 ? Math.round((folder.solved / folder.total) * 100) : 0;
                    return (
                      <div key={folder.name} className="folder-card" onClick={() => setActiveFolder(folder.name)}>
                        <div className="folder-card-glow"></div>
                        <div className="folder-card-header">
                          <div className="folder-icon-wrapper">
                            <Folder size={32} className="folder-icon" />
                          </div>
                          <span className="folder-badge">{folder.total} Qs</span>
                        </div>
                        <div className="folder-card-content">
                          <h3 className="folder-title" title={folder.name}>{folder.name}</h3>
                          <div className="folder-stats">
                            <span className="folder-stat-text">{folder.solved}/{folder.total} Solved</span>
                            <span className="folder-stat-percent">{percent}%</span>
                          </div>
                          <div className="folder-progress-bar">
                            <div className="folder-progress-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                          <div className="folder-difficulty-distribution">
                            {folder.easy > 0 && <span className="dist-badge easy">{folder.easy} Easy</span>}
                            {folder.medium > 0 && <span className="dist-badge medium">{folder.medium} Med</span>}
                            {folder.hard > 0 && <span className="dist-badge hard">{folder.hard} Hard</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Render Table View (for viewMode === 'table' or activeFolder is set) */
              <div>
                {viewMode === 'folder' && activeFolder && (
                  <div className="folder-detail-header">
                    <button className="btn btn-secondary btn-back" onClick={() => setActiveFolder(null)}>
                      <ArrowLeft size={16} /> Back to Folders
                    </button>
                    <div className="folder-path">
                      <span className="path-parent" onClick={() => setActiveFolder(null)}>Folders</span>
                      <span className="path-separator">/</span>
                      <span className="path-current">{activeFolder}</span>
                    </div>
                  </div>
                )}

                {questionsToRender.length === 0 ? (
                  <div className="empty-state">
                    <FolderOpen className="empty-state-icon" size={48} />
                    <h3>No questions found</h3>
                    <p>No questions match your current search or filter criteria in this view.</p>
                    <button className="btn btn-secondary" onClick={() => {
                      setFilters({ search: '', topic: 'all', difficulty: 'all', status: 'all', revisionSort: 'none' });
                    }} style={{ marginTop: '1rem' }}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="questions-table-container">
                    <div className="questions-table-header">
                      <div className="col-status">Status</div>
                      <div className="col-title">Title</div>
                      <div className="col-topic">Topic</div>
                      <div className="col-difficulty">Difficulty</div>
                      <div className="col-revisions">Revisions</div>
                      <div className="col-action">Action</div>
                    </div>
                    <div className="questions-table-body">
                      {questionsToRender.map((q) => (
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

                          <div className="col-revisions">
                            <div className="revisions-counter">
                              <button
                                className="btn-counter btn-counter-minus"
                                onClick={() => handleUpdateRevisions(q.id, (q.revisions || 0) - 1)}
                                disabled={(q.revisions || 0) <= 0}
                                title="Decrement revisions"
                              >
                                -
                              </button>
                              <span className="revisions-count">{q.revisions || 0}</span>
                              <button
                                className="btn-counter btn-counter-plus"
                                onClick={() => handleUpdateRevisions(q.id, (q.revisions || 0) + 1)}
                                title="Increment revisions"
                              >
                                +
                              </button>
                            </div>
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
              </div>
            )}
          </section>
        </main>
      )}

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container" style={{ justifyContent: 'center' }}>
          <p>Made by Gopal Kundu</p>
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
                <button type="submit" className="btn btn-primary">Save Question</button>
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
              <p>This action will reset your progress back to unsolved for all questions in your sheet.</p>
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
