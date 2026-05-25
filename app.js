// LeetTracker App Logic

// Global state
let state = {
  questions: [],
  filters: {
    search: '',
    topic: 'all',
    difficulty: 'all',
    status: 'all'
  }
};

// SVG Circle circumference calculation
const CIRCLE_CIRCUMFERENCE = 201.06; // 2 * Math.PI * 32

// DOM Elements
const topicsGrid = document.getElementById('topics-grid');
const totalCountEl = document.getElementById('total-count');
const solvedCountEl = document.getElementById('solved-count');
const progressRingCircle = document.getElementById('progress-ring-circle');
const progressPercentageText = document.getElementById('progress-percentage-text');
const overallProgressBar = document.getElementById('overall-progress-bar');
const topicsCountEl = document.getElementById('topics-count');

// Difficulty stats elements
const easySolvedEl = document.getElementById('easy-solved');
const easyTotalEl = document.getElementById('easy-total');
const easyProgressBar = document.getElementById('easy-progress-bar');

const mediumSolvedEl = document.getElementById('medium-solved');
const mediumTotalEl = document.getElementById('medium-total');
const mediumProgressBar = document.getElementById('medium-progress-bar');

const hardSolvedEl = document.getElementById('hard-solved');
const hardTotalEl = document.getElementById('hard-total');
const hardProgressBar = document.getElementById('hard-progress-bar');

// Tool controls
const searchInput = document.getElementById('search-input');
const filterTopic = document.getElementById('filter-topic');
const filterDifficulty = document.getElementById('filter-difficulty');
const filterStatus = document.getElementById('filter-status');
const btnExport = document.getElementById('btn-export');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const inputImportFile = document.getElementById('input-import-file');

// Modals
const modalAdd = document.getElementById('modal-add');
const btnAddQuestion = document.getElementById('btn-add-question');
const modalAddClose = document.getElementById('modal-add-close');
const modalAddCancel = document.getElementById('modal-add-cancel');
const formAddQuestion = document.getElementById('form-add-question');
const existingTopicsDatalist = document.getElementById('existing-topics');

const modalEdit = document.getElementById('modal-edit');
const modalEditClose = document.getElementById('modal-edit-close');
const modalEditCancel = document.getElementById('modal-edit-cancel');
const formEditQuestion = document.getElementById('form-edit-question');

const modalConfirm = document.getElementById('modal-confirm');
const btnReset = document.getElementById('btn-reset');
const modalConfirmClose = document.getElementById('modal-confirm-close');
const modalConfirmCancel = document.getElementById('modal-confirm-cancel');
const btnConfirmReset = document.getElementById('btn-confirm-reset');

// Initialize App
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  await loadData();
  setupEventListeners();
  updateDashboard();
  populateTopicFilterDropdown();
  renderBoard();
  populateTopicDatalist();
  
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Load data from localStorage or fetch from questions.json
async function loadData() {
  const localQuestions = localStorage.getItem('leettracker_questions');
  if (localQuestions) {
    try {
      state.questions = JSON.parse(localQuestions);
      return;
    } catch (e) {
      console.error('Error parsing local storage questions, reloading defaults...', e);
    }
  }

  // Load from questions.json file
  try {
    const response = await fetch('./questions.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Inject done: false into loaded questions if missing
    state.questions = data.map(q => ({
      ...q,
      done: q.done || false
    }));
    saveToLocalStorage();
  } catch (error) {
    console.error('Failed to load questions.json. If you are running locally without a web server (using file:// protocol), please use the "Import JSON" button in the toolbar to upload your questions.json file directly.', error);
    state.questions = [];
    saveToLocalStorage();
  }
}

// Save state to localStorage
function saveToLocalStorage() {
  localStorage.setItem('leettracker_questions', JSON.stringify(state.questions));
}

// Setup Event Listeners
function setupEventListeners() {
  // Filters
  searchInput.addEventListener('input', (e) => {
    state.filters.search = e.target.value.toLowerCase();
    renderBoard();
  });

  filterTopic.addEventListener('change', (e) => {
    state.filters.topic = e.target.value;
    renderBoard();
  });

  filterDifficulty.addEventListener('change', (e) => {
    state.filters.difficulty = e.target.value;
    renderBoard();
  });

  filterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    renderBoard();
  });

  // Modal toggle - Add Question
  btnAddQuestion.addEventListener('click', () => {
    populateTopicDatalist();
    openModal(modalAdd);
    document.getElementById('input-topic').focus();
  });

  modalAddClose.addEventListener('click', () => closeModal(modalAdd));
  modalAddCancel.addEventListener('click', () => closeModal(modalAdd));

  formAddQuestion.addEventListener('submit', handleAddQuestionSubmit);

  // Modal toggle - Edit Question
  modalEditClose.addEventListener('click', () => closeModal(modalEdit));
  modalEditCancel.addEventListener('click', () => closeModal(modalEdit));

  formEditQuestion.addEventListener('submit', handleEditQuestionSubmit);

  // Modal toggle - Reset Progress
  btnReset.addEventListener('click', () => openModal(modalConfirm));
  modalConfirmClose.addEventListener('click', () => closeModal(modalConfirm));
  modalConfirmCancel.addEventListener('click', () => closeModal(modalConfirm));
  btnConfirmReset.addEventListener('click', handleResetProgress);

  // Close modals on clicking overlay background
  [modalAdd, modalEdit, modalConfirm].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Global escape key to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(modalAdd);
      closeModal(modalEdit);
      closeModal(modalConfirm);
    }
  });

  // Export JSON
  btnExport.addEventListener('click', exportJSON);

  // Import JSON
  btnImportTrigger.addEventListener('click', () => {
    inputImportFile.click();
  });

  inputImportFile.addEventListener('change', handleImportFile);
}

// Modal actions
function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Disable page scrolling behind modal
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = ''; // Enable page scrolling
  if (modal === modalAdd) {
    formAddQuestion.reset();
  } else if (modal === modalEdit) {
    formEditQuestion.reset();
  }
}

// Add question
function handleAddQuestionSubmit(e) {
  e.preventDefault();

  const topicInput = document.getElementById('input-topic').value.trim();
  const nameInput = document.getElementById('input-name').value.trim();
  const linkInput = document.getElementById('input-link').value.trim();
  const difficultySelect = document.getElementById('input-difficulty').value;

  if (!topicInput || !nameInput || !linkInput) return;

  const newQuestion = {
    id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    topic: topicInput,
    name: nameInput,
    link: linkInput,
    difficulty: difficultySelect,
    done: false
  };

  state.questions.push(newQuestion);
  saveToLocalStorage();
  
  // UI Updates
  closeModal(modalAdd);
  updateDashboard();
  populateTopicFilterDropdown();
  renderBoard();
  populateTopicDatalist();

  // Show a mini notification or highlight the added question (could be added for visual polish)
}

// Open Edit Modal populated with question data
function openEditQuestionModal(id) {
  const q = state.questions.find(item => item.id === id);
  if (!q) return;

  document.getElementById('edit-id').value = q.id;
  document.getElementById('edit-topic').value = q.topic;
  document.getElementById('edit-name').value = q.name;
  document.getElementById('edit-link').value = q.link;
  document.getElementById('edit-difficulty').value = q.difficulty;

  populateTopicDatalist();
  openModal(modalEdit);
  document.getElementById('edit-topic').focus();
}

// Handle submit of edit question form
function handleEditQuestionSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const topicInput = document.getElementById('edit-topic').value.trim();
  const nameInput = document.getElementById('edit-name').value.trim();
  const linkInput = document.getElementById('edit-link').value.trim();
  const difficultySelect = document.getElementById('edit-difficulty').value;

  if (!topicInput || !nameInput || !linkInput) return;

  const qIndex = state.questions.findIndex(q => q.id === id);
  if (qIndex !== -1) {
    state.questions[qIndex].topic = topicInput;
    state.questions[qIndex].name = nameInput;
    state.questions[qIndex].link = linkInput;
    state.questions[qIndex].difficulty = difficultySelect;

    saveToLocalStorage();
    closeModal(modalEdit);
    updateDashboard();
    populateTopicFilterDropdown();
    renderBoard();
    populateTopicDatalist();
  }
}

// Toggle Done status
function toggleQuestionStatus(id) {
  const qIndex = state.questions.findIndex(q => q.id === id);
  if (qIndex !== -1) {
    state.questions[qIndex].done = !state.questions[qIndex].done;
    saveToLocalStorage();
    updateDashboard();
    renderBoard();
  }
}

// Delete Question
function deleteQuestion(id) {
  state.questions = state.questions.filter(q => q.id !== id);
  
  // If the currently filtered topic was deleted, reset topic filter to 'all'
  const topics = new Set(state.questions.map(q => q.topic));
  if (state.filters.topic !== 'all' && !topics.has(state.filters.topic)) {
    state.filters.topic = 'all';
  }
  
  saveToLocalStorage();
  updateDashboard();
  populateTopicFilterDropdown();
  renderBoard();
  populateTopicDatalist();
}

// Reset Progress
function handleResetProgress() {
  state.questions = state.questions.map(q => ({
    ...q,
    done: false
  }));
  saveToLocalStorage();
  closeModal(modalConfirm);
  updateDashboard();
  renderBoard();
}

// Handle local JSON file import
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const result = window.LeetTracker.importBackup(event.target.result);
    alert(result);
    inputImportFile.value = ''; // Reset file input
  };
  reader.readAsText(file);
}

// Populate Topic Autocomplete
function populateTopicDatalist() {
  const topics = [...new Set(state.questions.map(q => q.topic))].sort();
  existingTopicsDatalist.innerHTML = '';
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    existingTopicsDatalist.appendChild(option);
  });
}

// Populate Filter Topic Dropdown dynamically
function populateTopicFilterDropdown() {
  const selectedTopic = state.filters.topic;
  const topics = [...new Set(state.questions.map(q => q.topic))].sort();
  
  // Reset but keep default option
  filterTopic.innerHTML = '<option value="all">All Topics</option>';
  
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    if (topic === selectedTopic) {
      option.selected = true;
    }
    filterTopic.appendChild(option);
  });
}

// Update Dashboard Statistics
function updateDashboard() {
  const total = state.questions.length;
  const solved = state.questions.filter(q => q.done).length;
  
  // Calculate unique topics
  const uniqueTopics = [...new Set(state.questions.map(q => q.topic))].length;

  // Set counters
  totalCountEl.textContent = total;
  solvedCountEl.textContent = solved;
  topicsCountEl.textContent = uniqueTopics;

  // Set Overall circular progress
  const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
  progressPercentageText.textContent = `${percentage}%`;
  
  // Set overall linear progress bar
  overallProgressBar.style.width = `${percentage}%`;

  // SVG Circle Stroke offset animation
  if (progressRingCircle) {
    const offset = CIRCLE_CIRCUMFERENCE - (percentage / 100) * CIRCLE_CIRCUMFERENCE;
    progressRingCircle.style.strokeDashoffset = offset;
  }

  // Difficulty Counters
  const difficultyCounts = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 }
  };

  state.questions.forEach(q => {
    if (difficultyCounts[q.difficulty]) {
      difficultyCounts[q.difficulty].total++;
      if (q.done) {
        difficultyCounts[q.difficulty].solved++;
      }
    }
  });

  // Update Easy
  easyTotalEl.textContent = difficultyCounts.Easy.total;
  easySolvedEl.textContent = difficultyCounts.Easy.solved;
  const easyPercent = difficultyCounts.Easy.total > 0 ? (difficultyCounts.Easy.solved / difficultyCounts.Easy.total) * 100 : 0;
  easyProgressBar.style.width = `${easyPercent}%`;

  // Update Medium
  mediumTotalEl.textContent = difficultyCounts.Medium.total;
  mediumSolvedEl.textContent = difficultyCounts.Medium.solved;
  const mediumPercent = difficultyCounts.Medium.total > 0 ? (difficultyCounts.Medium.solved / difficultyCounts.Medium.total) * 100 : 0;
  mediumProgressBar.style.width = `${mediumPercent}%`;

  // Update Hard
  hardTotalEl.textContent = difficultyCounts.Hard.total;
  hardSolvedEl.textContent = difficultyCounts.Hard.solved;
  const hardPercent = difficultyCounts.Hard.total > 0 ? (difficultyCounts.Hard.solved / difficultyCounts.Hard.total) * 100 : 0;
  hardProgressBar.style.width = `${hardPercent}%`;
}

// Render Board
function renderBoard() {
  // Clear the board
  topicsGrid.innerHTML = '';

  // Get active filters
  const { search, topic, difficulty, status } = state.filters;

  // Filtered list
  const filteredQuestions = state.questions.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(search) || q.topic.toLowerCase().includes(search);
    const matchesTopic = topic === 'all' || q.topic === topic;
    const matchesDifficulty = difficulty === 'all' || q.difficulty === difficulty;
    const matchesStatus = status === 'all' || 
                         (status === 'solved' && q.done) || 
                         (status === 'unsolved' && !q.done);
    return matchesSearch && matchesTopic && matchesDifficulty && matchesStatus;
  });

  if (filteredQuestions.length === 0) {
    renderEmptyState();
    return;
  }

  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'questions-table-container';

  const tableHeader = document.createElement('div');
  tableHeader.className = 'questions-table-header';
  tableHeader.innerHTML = `
    <div class="col-status">Status</div>
    <div class="col-title">Title</div>
    <div class="col-topic">Topic</div>
    <div class="col-difficulty">Difficulty</div>
    <div class="col-action">Action</div>
  `;
  tableContainer.appendChild(tableHeader);

  const tableBody = document.createElement('div');
  tableBody.className = 'questions-table-body';

  // Sort questions: Numeric IDs first in order, then custom questions at the end
  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    const idA = parseInt(a.id, 10);
    const idB = parseInt(b.id, 10);
    if (!isNaN(idA) && !isNaN(idB)) {
      return idA - idB;
    }
    if (isNaN(idA) && !isNaN(idB)) return 1;
    if (!isNaN(idA) && isNaN(idB)) return -1;
    return a.id.localeCompare(b.id);
  });

  sortedQuestions.forEach(q => {
    const row = document.createElement('div');
    row.className = `question-row difficulty-${q.difficulty.toLowerCase()} ${q.done ? 'solved' : ''}`;
    row.setAttribute('data-id', q.id);

    // Status Column
    const statusCol = document.createElement('div');
    statusCol.className = 'col-status';
    const doneToggleBtn = document.createElement('button');
    doneToggleBtn.className = 'btn-done-toggle';
    doneToggleBtn.innerHTML = `<i data-lucide="check"></i>`;
    doneToggleBtn.addEventListener('click', () => toggleQuestionStatus(q.id));
    statusCol.appendChild(doneToggleBtn);

    // Title Column
    const titleCol = document.createElement('div');
    titleCol.className = 'col-title';
    const link = document.createElement('a');
    link.href = q.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'question-link';
    link.title = `Solve '${q.name}' on LeetCode`;
    link.innerHTML = `
      <span>${q.name}</span>
      <i data-lucide="external-link" class="question-link-icon"></i>
    `;
    titleCol.appendChild(link);

    // Topic Column
    const topicCol = document.createElement('div');
    topicCol.className = 'col-topic';
    const topicBadge = document.createElement('span');
    topicBadge.className = 'topic-badge';
    topicBadge.textContent = q.topic;
    topicCol.appendChild(topicBadge);

    // Difficulty Column
    const diffCol = document.createElement('div');
    diffCol.className = 'col-difficulty';
    const diffBadge = document.createElement('span');
    diffBadge.className = `diff-badge ${q.difficulty.toLowerCase()}`;
    diffBadge.textContent = q.difficulty;
    diffCol.appendChild(diffBadge);

    // Action Column
    const actionCol = document.createElement('div');
    actionCol.className = 'col-action';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.innerHTML = `<i data-lucide="edit"></i>`;
    editBtn.title = 'Edit this question';
    editBtn.addEventListener('click', () => openEditQuestionModal(q.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    deleteBtn.title = 'Delete this question';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete "${q.name}"?`)) {
        deleteQuestion(q.id);
      }
    });
    actionCol.appendChild(editBtn);
    actionCol.appendChild(deleteBtn);

    row.appendChild(statusCol);
    row.appendChild(titleCol);
    row.appendChild(topicCol);
    row.appendChild(diffCol);
    row.appendChild(actionCol);

    tableBody.appendChild(row);
  });

  tableContainer.appendChild(tableBody);
  topicsGrid.appendChild(tableContainer);

  // Re-instantiate Lucide icons for dynamically added items
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render empty search or empty board state
function renderEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
    <i data-lucide="folder-open" class="empty-state-icon"></i>
    <h3>No Questions Found</h3>
    <p>We couldn't find any questions matching your filters. Try clearing your search query or add a new question!</p>
  `;
  topicsGrid.appendChild(emptyState);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Export data as JSON file backup (highly useful for local storage backup)
function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.questions, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "leettracker_dsa_data.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Expose backup utilities to console or custom buttons if needed
window.LeetTracker = {
  exportBackup: exportJSON,
  importBackup: function(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        state.questions = parsed.map(q => ({
          id: q.id || 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          topic: q.topic || 'General',
          name: q.name || 'Untitled Question',
          link: q.link || '#',
          difficulty: q.difficulty || 'Medium',
          done: q.done || false
        }));
        // Reset topic filter to 'all' on import just in case
        state.filters.topic = 'all';
        saveToLocalStorage();
        updateDashboard();
        populateTopicFilterDropdown();
        renderBoard();
        populateTopicDatalist();
        return "Import successful!";
      }
      return "Format invalid. Must be an array of questions.";
    } catch(e) {
      return "Error parsing JSON: " + e.message;
    }
  }
};
