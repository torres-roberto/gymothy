console.log('[DEBUG] main.js loaded');

let exercises = [];
let authToken = null;
let currentUser = null;

// Global error handler to catch any unhandled errors
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error);
  console.error('[GLOBAL ERROR] Stack:', event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[GLOBAL PROMISE ERROR]', event.reason);
});

// Environment detection
const hostname = window.location.hostname;
const port = window.location.port;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

// Set API URLs based on environment
const API_URL = isLocalhost ? 'http://localhost:3000/api/entries' : 'https://gymothy-backend.onrender.com/api/entries';
const AUTH_URL = isLocalhost ? 'http://localhost:3000' : 'https://gymothy-backend.onrender.com';

console.log('[DEBUG] Hostname:', hostname, 'Port:', port, 'Full URL:', window.location.href);
console.log('[DEBUG] Is localhost:', isLocalhost);
console.log('[DEBUG] API_URL:', API_URL);
console.log('[DEBUG] AUTH_URL:', AUTH_URL);

// Update OAuth URL based on environment
function updateOAuthURL() {
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    const oauthUrl = `${AUTH_URL}/auth/google`;
    googleSignInBtn.href = oauthUrl;
    googleSignInBtn.onclick = (e) => {
      e.preventDefault();
      console.log('[DEBUG] OAuth button clicked, redirecting to:', oauthUrl);
      window.location.href = oauthUrl;
    };
  }
}

// Logging helper
function log(...args) {
  console.log('[Gymothy]', ...args);
}

// Local storage keys
const STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'gymothy_journal_entries',
  LAST_SYNC: 'gymothy_last_sync',
  AUTH_TOKEN: 'gymothy_auth_token',
  USER_INFO: 'gymothy_user_info',
  LAST_WEIGHT: 'gymothy_last_weight'
};

// Authentication management
const Auth = {
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setToken(token) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    authToken = token;
  },

  clearToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    authToken = null;
  },

  getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    currentUser = user;
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    currentUser = null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async logout() {
    try {
      const response = await fetch(`${AUTH_URL}/auth/logout`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      if (response.ok) {
        console.log('[DEBUG] Logout successful');
      }
    } catch (error) {
      console.error('[DEBUG] Logout error:', error);
    }
    this.clearToken();
    this.clearUser();
    this.updateUI();
    window.location.reload();
  },

  updateUI() {
    const isAuthenticated = Auth.isAuthenticated();
    const user = Auth.getUser();
    console.log('[DEBUG] updateUI called. Authenticated:', isAuthenticated, 'User:', user);

    // User info elements
    const userNameElem = document.getElementById('userName');
    const userAvatarElem = document.getElementById('userAvatar');

    if (isAuthenticated && user) {
      if (userNameElem) userNameElem.textContent = user.name || 'User';
      if (userAvatarElem) userAvatarElem.src = user.picture || 'https://ui-avatars.com/api/?name=User';
    } else {
      if (userNameElem) userNameElem.textContent = '';
      if (userAvatarElem) userAvatarElem.src = '';
    }

    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    const loginCard = document.getElementById('loginCard');

    const token = this.getToken();
    console.log('[DEBUG] updateUI called. Authenticated:', !!token, 'Token:', token ? token.slice(0, 12) + '...' : 'none');

    if (this.isAuthenticated()) {
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userInfo) {
        userInfo.style.display = 'block';
        userInfo.innerHTML = `
          <div class="user-profile">
            <img src="${user.picture || 'https://ui-avatars.com/api/?name=User'}" alt="Profile" class="user-avatar">
            <span class="user-name">${user.name}</span>
          </div>
        `;
      }
      if (mainContent) mainContent.style.display = 'block';
      if (loginCard) loginCard.style.display = 'none';
      console.log('[DEBUG] Main UI shown.');
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
      if (mainContent) mainContent.style.display = 'none';
      if (loginCard) loginCard.style.display = 'block';
      console.log('[DEBUG] Not authenticated. Showing login card.');
    }
  }
};

// Local storage management
const LocalStorage = {
  getEntries() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[ERROR] Failed to get entries from localStorage:', error);
      return [];
    }
  },

  saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(entries));
      console.log('[DEBUG] Saved entries to localStorage:', entries.length);
    } catch (error) {
      console.error('[ERROR] Failed to save entries to localStorage:', error);
    }
  },

  getLastSync() {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('[ERROR] Failed to get last sync from localStorage:', error);
      return null;
    }
  },

  setLastSync() {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('[ERROR] Failed to set last sync in localStorage:', error);
    }
  },

  getLastWeight() {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_WEIGHT);
    } catch (error) {
      console.error('[ERROR] Failed to get last weight from localStorage:', error);
      return null;
    }
  },

  setLastWeight(weight) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_WEIGHT, weight);
    } catch (error) {
      console.error('[ERROR] Failed to set last weight in localStorage:', error);
    }
  }
};

// API client
const API = {
  async request(endpoint, options = {}) {
    const token = Auth.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };

    console.log('[DEBUG] API request:', endpoint, finalOptions);
    const response = await fetch(endpoint, finalOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    return response;
  },

  async get(endpoint) {
    const response = await this.request(endpoint);
    return response.json();
  },

  async post(endpoint, data) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint) {
    const response = await this.request(endpoint, {
      method: 'DELETE'
    });
    return response.json();
  }
};

// Typewriter clear effect
function typewriterClear(input, speed = 30) {
  const text = input.value;
  let i = text.length;
  
  const backspace = () => {
    if (i > 0) {
      input.value = text.substring(0, i - 1);
      i--;
      setTimeout(backspace, speed);
    }
  };
  
  backspace();
}

// Load journal entries from server
async function loadJournal() {
  try {
    console.log('[DEBUG] Loading journal entries...');
    const entries = await API.get(API_URL);
    console.log('[DEBUG] Loaded entries:', entries);
    
    // Store entries locally
    LocalStorage.saveEntries(entries);
    LocalStorage.setLastSync();
    
    // Display entries
    displayJournal(entries);
    updateCharts(entries);
  } catch (error) {
    console.error('[ERROR] Failed to load journal:', error);
    // Try to load from local storage as fallback
    const localEntries = LocalStorage.getEntries();
    if (localEntries.length > 0) {
      console.log('[DEBUG] Loading from local storage as fallback');
      displayJournal(localEntries);
      updateCharts(localEntries);
    }
  }
}

// Display journal entries with expandable/collapsible functionality
function displayJournal(entries) {
  const entriesList = document.getElementById('entriesList');
  if (!entriesList) return;
  entriesList.innerHTML = '';

  // Group entries by date
  const groupedByDate = {};
  entries.forEach(entry => {
    if (!groupedByDate[entry.date]) {
      groupedByDate[entry.date] = {
        ...entry,
        exercises: [...entry.exercises]
      };
    } else {
      // Merge exercises for the same date
      groupedByDate[entry.date].exercises.push(...entry.exercises);
      // Prefer the latest non-empty bodyWeight
      if (entry.bodyWeight) groupedByDate[entry.date].bodyWeight = entry.bodyWeight;
    }
  });
  const groupedEntries = Object.values(groupedByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

  groupedEntries.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'journal-entry';
    const entryDate = new Date(entry.date).toLocaleDateString();
    // Format exercises with grouped set display, each on a separate line
    const exercises = entry.exercises.map(ex => {
      const groupedSets = groupSets(ex.sets);
      let setDisplay = groupedSets
        .map(set => {
          let base = `${set.weight || ''}lb × ${set.reps || ''}${set.time ? ` @ ${set.time}` : ''}`;
          if (set.count > 1) base += ` x ${set.count}`;
          return base;
        })
        .join(', ');
      return `${ex.name}: ${setDisplay}`;
    }).join('<br>');
    li.innerHTML = `
      <div class="entry-header" onclick="toggleEntry(${index})">
        <div class="entry-title">
          <span class="expand-icon">▼</span>
          <strong>${entryDate}</strong>
          ${entry.bodyWeight ? `<span class="weight">${entry.bodyWeight}lb</span>` : ''}
        </div>
      </div>
      <div class="entry-content" id="entry-content-${index}">
        <div class="exercises">${exercises}</div>
      </div>
    `;
    entriesList.appendChild(li);
  });
}

// Toggle entry expansion
function toggleEntry(index) {
  const content = document.getElementById(`entry-content-${index}`);
  const header = content.previousElementSibling;
  const icon = header.querySelector('.expand-icon');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
}

// Update progress charts
function updateCharts(entries = []) {
  const canvas = document.getElementById('progressChart');
  if (!canvas || entries.length === 0) return;

  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.progressChart) {
    window.progressChart.destroy();
  }

  const sortedEntries = entries
    .filter(entry => entry.bodyWeight)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (sortedEntries.length === 0) return;

  const labels = sortedEntries.map(entry => new Date(entry.date).toLocaleDateString());
  const weights = sortedEntries.map(entry => parseFloat(entry.bodyWeight));

  window.progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Body Weight (lb)',
        data: weights,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: '#232946'
          },
          ticks: {
            color: '#b8c1ec'
          }
        },
        x: {
          grid: {
            color: '#232946'
          },
          ticks: {
            color: '#b8c1ec'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#b8c1ec'
          }
        }
      }
    }
  });
}

// Initialize application
function initializeApp() {
  console.log('[DEBUG] initializeApp called');
  
  // Update OAuth URL
  updateOAuthURL();
  
  // Set default date
  const dateInput = document.getElementById('dateInput');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Load last saved body weight
  const weightInput = document.getElementById('weightInput');
  if (weightInput) {
    const lastWeight = LocalStorage.getLastWeight();
    if (lastWeight) {
      weightInput.value = lastWeight;
    }
  }

  // Check for token in URL (OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('[DEBUG] OAuth error in URL:', error);
    alert(`Login failed: ${error}. Please try again.`);
    // Clear the error from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (token) {
    console.log('[DEBUG] Token found in URL, length:', token.length);
    try {
      Auth.setToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('[DEBUG] Token stored successfully');
      
      // Try to decode and display user info for debugging
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('[DEBUG] Token payload:', payload);
          if (payload.email && payload.name) {
            Auth.setUser({ email: payload.email, name: payload.name });
            console.log('[DEBUG] User info set from token');
          }
        } catch (e) {
          console.log('[DEBUG] Could not decode token payload:', e);
        }
      }
    } catch (e) {
      console.error('[DEBUG] Error storing token:', e);
      alert('Error processing login. Please try again.');
    }
  }

  // Update UI
  Auth.updateUI();

  // Attach event listeners
  attachEventListeners();
}

// Attach all event listeners
function attachEventListeners() {
  console.log('[DEBUG] attachEventListeners called');

  // Add Exercise button
  const addExerciseBtn = document.getElementById('addExerciseToList');
  if (addExerciseBtn) {
    addExerciseBtn.addEventListener('click', () => {
      console.log('[DEBUG] Add Exercise button clicked');
      const name = document.querySelector('.exercise-entry input[name="exercise"]').value.trim();
      const weight = document.querySelector('.exercise-entry input[name="set-weight"]').value;
      const reps = document.querySelector('.exercise-entry input[name="set-reps"]').value;
      const time = document.querySelector('.exercise-entry input[name="set-time"]').value;
      
      console.log('[DEBUG] Read form values:', { name, weight, reps, time });
      if (!name) {
        console.log('[DEBUG] No exercise name, showing alert');
        alert('Exercise name is required.');
        return;
      }
      
      const newSet = {
        weight: weight ? parseFloat(weight) : undefined,
        reps: reps ? parseInt(reps) : undefined,
        time: time || undefined
      };
      
      console.log('[DEBUG] New set object:', newSet);
      
      // Check if exercise with same name already exists
      const existingExerciseIndex = exercises.findIndex(ex => ex.name === name);
      
      console.log('[DEBUG] Existing exercise index:', existingExerciseIndex);
      
      if (existingExerciseIndex !== -1) {
        // Add to existing exercise as a new set
        exercises[existingExerciseIndex].sets.push(newSet);
        console.log('[DEBUG] Set added to existing exercise:', exercises[existingExerciseIndex]);
      } else {
        // Create new exercise
        exercises.push({
          name,
          sets: [newSet]
        });
        console.log('[DEBUG] New exercise added to list:', exercises[exercises.length - 1]);
      }
      
      console.log('[DEBUG] Current exercises array:', exercises);
      renderExerciseList();
      // Keep all form fields populated for convenience
    });
    console.log('[DEBUG] Add Exercise button event listener attached');
  } else {
    console.error('[DEBUG] Add Exercise button not found');
  }

  // Save Journal button
  const entryForm = document.getElementById('entryForm');
  if (entryForm) {
    entryForm.addEventListener('submit', saveJournalEntry);
    console.log('[DEBUG] Save Journal form listener attached');
  } else {
    console.error('[DEBUG] Entry form not found');
  }

  // Clear Exercises button
  const clearBtn = document.getElementById('clearExercises');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      console.log('[DEBUG] Clear Exercises button clicked');
      // Clear form fields with typewriter effect
      const fields = [
        document.querySelector('.exercise-entry input[name="exercise"]'),
        document.querySelector('.exercise-entry input[name="set-weight"]'),
        document.querySelector('.exercise-entry input[name="set-reps"]'),
        document.querySelector('.exercise-entry input[name="set-time"]')
      ];
      
      // Clear fields with staggered timing for a nice effect
      fields.forEach((field, index) => {
        setTimeout(() => {
          if (field) {
            typewriterClear(field, 30);
          }
        }, index * 100);
      });
      
      // Clear exercises array
      exercises = [];
      renderExerciseList();
      
      // Show/hide clear button
      if (clearBtn) {
        clearBtn.style.display = 'none';
      }
    });
    console.log('[DEBUG] Clear Exercises button event listener attached');
  } else {
    console.log('[DEBUG] Clear Exercises button not found');
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('[DEBUG] Logout button clicked');
      Auth.logout();
    });
    console.log('[DEBUG] Logout button listener attached');
  } else {
    console.error('[DEBUG] Logout button not found');
  }

  // Show clear button when exercises are added
  const exerciseList = document.getElementById('exerciseList');
  if (exerciseList) {
    const observer = new MutationObserver(() => {
      const clearBtn = document.getElementById('clearExercises');
      if (clearBtn) {
        clearBtn.style.display = exerciseList.children.length > 0 ? 'block' : 'none';
      }
    });
    observer.observe(exerciseList, { childList: true });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('[DEBUG] DOMContentLoaded fired');
  initializeApp();
});

// Expose functions globally for debugging
window.loadJournal = loadJournal;
window.Auth = Auth;
window.toggleEntry = toggleEntry;

function groupSets(sets) {
  // Groups identical sets and returns an array of {weight, reps, time, count}
  const grouped = [];
  for (const set of sets) {
    const last = grouped[grouped.length - 1];
    if (
      last &&
      last.weight === set.weight &&
      last.reps === set.reps &&
      last.time === set.time
    ) {
      last.count++;
    } else {
      grouped.push({ ...set, count: 1 });
    }
  }
  return grouped;
}

function renderExerciseList() {
  const exerciseList = document.getElementById('exerciseList');
  if (!exerciseList) return;
  exerciseList.innerHTML = '';
  exercises.forEach((exercise, idx) => {
    const li = document.createElement('li');
    // Group identical sets
    const groupedSets = groupSets(exercise.sets);
    let setDisplay = groupedSets
      .map(set => {
        let base = `${set.weight || ''}lb × ${set.reps || ''}${set.time ? ` @ ${set.time}` : ''}`;
        if (set.count > 1) base += ` x ${set.count}`;
        return base;
      })
      .join(', ');
    let exerciseText = `${exercise.name}: ${setDisplay}`;
    li.innerHTML = `<span>${exerciseText}</span>`;
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'removeExerciseFromList';
    removeBtn.onclick = () => {
      exercises.splice(idx, 1);
      renderExerciseList();
    };
    li.appendChild(removeBtn);
    exerciseList.appendChild(li);
  });
}

async function saveJournalEntry(e) {
  if (e) e.preventDefault();
  const dateInput = document.getElementById('dateInput');
  const weightInput = document.getElementById('weightInput');
  if (!dateInput) return;
  
  const entry = {
    date: dateInput.value,
    bodyWeight: weightInput && weightInput.value ? weightInput.value : undefined,
    exercises: exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets
    }))
  };
  
  try {
    // First, get existing entries to check for same date
    const existingEntries = await API.get(API_URL);
    const existingEntryIndex = existingEntries.findIndex(e => e.date === entry.date);
    
    let response;
    if (existingEntryIndex !== -1) {
      // Merge with existing entry
      const existingEntry = existingEntries[existingEntryIndex];
      const mergedEntry = {
        ...existingEntry,
        bodyWeight: entry.bodyWeight || existingEntry.bodyWeight,
        exercises: [...existingEntry.exercises, ...entry.exercises]
      };
      
      // Use bulk update to replace the entry
      response = await fetch(API_URL + '/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify({
          entries: existingEntries.map((e, i) => i === existingEntryIndex ? mergedEntry : e)
        })
      });
    } else {
      // Create new entry
      response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.getToken()}`
        },
        body: JSON.stringify(entry)
      });
    }
    
    if (response.ok) {
      exercises = [];
      renderExerciseList();
      loadJournal();
      
      // Save body weight if provided
      if (weightInput && weightInput.value) {
        LocalStorage.setLastWeight(weightInput.value);
      }
      
      // Show success message
      const msg = document.createElement('div');
      msg.className = 'success-message';
      msg.textContent = existingEntryIndex !== -1 ? 'Journal entry updated!' : 'Journal entry saved!';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 2000);
    } else {
      alert('Failed to save entry.');
    }
  } catch (err) {
    alert('Error saving entry.');
    console.error(err);
  }
}

window.renderExerciseList = renderExerciseList;
window.saveJournalEntry = saveJournalEntry; 