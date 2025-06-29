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
    if (isLocalhost) {
      // For local development, create a mock login button
      googleSignInBtn.textContent = 'Mock Login (Dev)';
      googleSignInBtn.href = '#';
      googleSignInBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('[DEBUG] Mock login clicked');
        
        // Create a mock user and token for local development
        const mockUser = {
          email: 'dev@example.com',
          name: 'Development User',
          picture: 'https://ui-avatars.com/api/?name=Dev+User'
        };
        
        // Simple mock token for local development
        const mockToken = 'mock-dev-token-' + Date.now();
        
        Auth.setToken(mockToken);
        Auth.setUser(mockUser);
        Auth.updateUI();
        
        console.log('[DEBUG] Mock login successful');
      });
    } else {
      // Production OAuth
      const oauthUrl = `${AUTH_URL}/auth/google`;
      googleSignInBtn.href = oauthUrl;
      console.log('[DEBUG] OAuth URL set to:', oauthUrl);
      
      // Add error handling for OAuth button clicks
      googleSignInBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          console.log('[DEBUG] OAuth button clicked, redirecting to:', oauthUrl);
          
          // First check if the OAuth endpoint is available
          const checkResponse = await fetch(oauthUrl, { method: 'HEAD' });
          console.log('[DEBUG] OAuth endpoint check status:', checkResponse.status);
          
          if (checkResponse.status === 503) {
            alert('OAuth service is currently unavailable. Please try again later or contact support.');
            return;
          }
          
          window.location.href = oauthUrl;
        } catch (error) {
          console.error('[DEBUG] OAuth redirect error:', error);
          alert('Login service temporarily unavailable. Please try again later.');
        }
      });
    }
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
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const mainContent = document.getElementById('mainContent');
    const loginCard = document.getElementById('loginCard');

    const token = this.getToken();
    console.log('[DEBUG] updateUI called. Authenticated:', !!token, 'Token:', token ? token.slice(0, 12) + '...' : 'none');

    if (this.isAuthenticated()) {
      const user = this.getUser();
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
  }
};

// API helper with authentication
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

    const response = await fetch(`${AUTH_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    });

    if (response.status === 401) {
      Auth.logout();
      throw new Error('Authentication expired');
    }

    return response;
  },

  async get(endpoint) {
    return this.request(endpoint);
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
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

// Global test function to verify saveEntry is accessible
window.testSaveEntry = function() {
  console.log('[TEST] Testing saveEntry function...');
  console.log('[TEST] saveEntry function exists:', typeof saveEntry);
  console.log('[TEST] Current exercises:', exercises);
  console.log('[TEST] Form elements:', {
    dateInput: document.getElementById('dateInput'),
    weightInput: document.getElementById('weightInput'),
    goalInput: document.getElementById('goalInput')
  });
  
  if (typeof saveEntry === 'function') {
    console.log('[TEST] Calling saveEntry...');
    saveEntry();
  } else {
    console.error('[TEST] saveEntry function not found!');
  }
};

// Global function to clear all entries
window.clearAllEntries = function() {
  console.log('[TEST] Clearing all entries...');
  LocalStorage.saveEntries([]);
  displayJournal([]);
  API.delete('/api/entries')
    .then(response => response.json())
    .then(data => {
      console.log('[TEST] All entries cleared:', data);
    })
    .catch(error => {
      console.error('[ERROR] Error clearing entries:', error);
    });
};

// Load journal entries from API
async function loadJournal() {
  console.log('[DEBUG] loadJournal called');
  if (!Auth.isAuthenticated()) {
    console.log('[DEBUG] Not authenticated, skipping journal load');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      headers: {
        'Authorization': `Bearer ${Auth.getToken()}`
      }
    });
    
    if (response.ok) {
      const journalEntries = await response.json();
      console.log('[DEBUG] Journal loaded:', journalEntries.length, 'entries');
      displayJournal(journalEntries);
      updateCharts();
    } else {
      console.error('[DEBUG] Failed to load journal:', response.status);
    }
  } catch (error) {
    console.error('[DEBUG] Error loading journal:', error);
  }
}

// Display journal entries
function displayJournal(entries) {
  const entriesList = document.getElementById('entriesList');
  if (!entriesList) return;

  entriesList.innerHTML = '';
  
  const sortedEntries = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sortedEntries.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'journal-entry';
    
    const entryDate = new Date(entry.date).toLocaleDateString();
    const exercises = entry.exercises.map(ex => 
      `${ex.name}: ${ex.sets.map(set => 
        `${set.weight}lb × ${set.reps}${set.time ? ` @ ${set.time}` : ''}`
      ).join(', ')}`
    ).join('; ');
    
    li.innerHTML = `
      <div class="entry-header">
        <strong>${entryDate}</strong>
        ${entry.bodyWeight ? `<span class="weight">${entry.bodyWeight}lb</span>` : ''}
        ${entry.goals ? `<span class="goals">${entry.goals}</span>` : ''}
      </div>
      <div class="exercises">${exercises}</div>
    `;
    
    entriesList.appendChild(li);
  });
}

// Update progress charts
function updateCharts() {
  const canvas = document.getElementById('progressChart');
  if (!canvas || journalEntries.length === 0) return;

  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.progressChart) {
    window.progressChart.destroy();
  }

  const sortedEntries = journalEntries
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
      // Check if exercise with same name and parameters already exists
      const existingExerciseIndex = exercises.findIndex(ex => 
        ex.name === name && 
        ex.sets.length > 0 &&
        ex.sets[0].weight === newSet.weight &&
        ex.sets[0].reps === newSet.reps &&
        ex.sets[0].time === newSet.time
      );
      
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

function renderExerciseList() {
  const exerciseList = document.getElementById('exerciseList');
  if (!exerciseList) return;
  exerciseList.innerHTML = '';
  exercises.forEach((exercise, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<span><strong>${exercise.name}</strong>: ${exercise.sets.map(set => `${set.weight ?? ''}lb × ${set.reps ?? ''}${set.time ? ` @ ${set.time}` : ''}`).join(', ')}</span>`;
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
  const goalInput = document.getElementById('goalInput');
  if (!dateInput) return;
  const entry = {
    date: dateInput.value,
    bodyWeight: weightInput && weightInput.value ? weightInput.value : undefined,
    goals: goalInput && goalInput.value ? goalInput.value : undefined,
    exercises: exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets
    }))
  };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Auth.getToken()}`
      },
      body: JSON.stringify(entry)
    });
    if (response.ok) {
      exercises = [];
      renderExerciseList();
      loadJournal();
      if (weightInput && weightInput.value) {
        localStorage.setItem(STORAGE_KEYS.LAST_WEIGHT, weightInput.value);
      }
      // Show success message
      const msg = document.createElement('div');
      msg.className = 'success-message';
      msg.textContent = 'Journal entry saved!';
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