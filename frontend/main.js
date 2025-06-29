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

function updateDebugBanner(extra) {
  const banner = document.getElementById('debugBanner');
  if (!banner) return;
  const token = Auth.getToken();
  const isAuth = !!token;
  let addExerciseStatus = window._addExerciseListenerAttached ? 'attached' : 'not attached';
  banner.innerText =
    `[DEBUG] Authenticated: ${isAuth} | Token: ${token ? token.slice(0, 12) + '...' : 'none'} | Add Exercise: ${addExerciseStatus}` + (extra ? ` | ${extra}` : '');
  banner.style.display = 'block';
}

// Enhanced localhost detection with debugging
const hostname = window.location.hostname;
const port = window.location.port;
console.log('[DEBUG] Hostname:', hostname, 'Port:', port, 'Full URL:', window.location.href);

const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
console.log('[DEBUG] Is localhost:', isLocalhost);

// Set API URLs based on environment
const API_URL = isLocalhost ? 'http://localhost:3000/api/entries' : 'https://gymothy-backend.onrender.com/api/entries';
const AUTH_URL = isLocalhost ? 'http://localhost:3000' : 'https://gymothy-backend.onrender.com';
console.log('[DEBUG] API_URL:', API_URL);
console.log('[DEBUG] AUTH_URL:', AUTH_URL);

// Update OAuth URL dynamically
function updateOAuthURL() {
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    const oauthURL = isLocalhost ? 'http://localhost:3000/auth/google' : 'https://gymothy-backend.onrender.com/auth/google';
    googleSignInBtn.href = oauthURL;
    console.log('[DEBUG] OAuth URL set to:', oauthURL);
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

  login() {
    window.location.href = `${AUTH_URL}/auth/google`;
  },

  logout() {
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
    console.log('[DEBUG] updateUI called. Authenticated:', !!token, 'Token:', token);

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
    updateDebugBanner();
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
  displayEntries([]);
  API.delete('/api/entries')
    .then(response => response.json())
    .then(data => {
      console.log('[TEST] All entries cleared:', data);
    })
    .catch(error => {
      console.error('[ERROR] Error clearing entries:', error);
    });
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOM loaded, initializing app...');
  
  // Update OAuth URL based on environment
  updateOAuthURL();
  
  // Set date input to today by default
  const dateInput = document.getElementById('dateInput');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Check for authentication token in URL (from OAuth callback)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    Auth.setToken(token);
    // Clear token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // Fetch user info
    API.get('/auth/me')
      .then(response => response.json())
      .then(data => {
        Auth.setUser(data.user);
        Auth.updateUI();
        loadJournal();
      })
      .catch(error => {
        console.error('[ERROR] Failed to get user info:', error);
        Auth.logout();
      });
  } else {
    // Check for existing token
    const existingToken = Auth.getToken();
    if (existingToken) {
      authToken = existingToken;
      currentUser = Auth.getUser();
      Auth.updateUI();
      loadJournal();
    } else {
      Auth.updateUI();
    }
  }

  // Setup authentication buttons
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      Auth.login();
    });
    console.log('[DEBUG] Login button event listener attached');
  } else {
    console.log('[DEBUG] Login button not found');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
    });
    console.log('[DEBUG] Logout button event listener attached');
  } else {
    console.log('[DEBUG] Logout button not found');
  }
  
  try {
    const form = document.getElementById('entryForm');
    const addExerciseToListBtn = document.getElementById('addExerciseToList');
    const clearExercisesBtn = document.getElementById('clearExercises');
    const exerciseEntryDiv = document.querySelector('.exercise-entry');
    const exerciseListUl = document.getElementById('exerciseList');
    const exercisesDiv = document.getElementById('exercises');
    const entriesList = document.getElementById('entriesList');
    const journalSection = document.getElementById('journal');
    const chartsSection = document.getElementById('charts');

    console.log('[DEBUG] DOM elements found:', {
      form: !!form,
      addExerciseToListBtn: !!addExerciseToListBtn,
      clearExercisesBtn: !!clearExercisesBtn,
      exerciseEntryDiv: !!exerciseEntryDiv,
      exerciseListUl: !!exerciseListUl,
      exercisesDiv: !!exercisesDiv,
      entriesList: !!entriesList,
      journalSection: !!journalSection,
      chartsSection: !!chartsSection
    });

    // Hide sections initially
    if (journalSection) journalSection.style.display = 'none';
    if (chartsSection) chartsSection.style.display = 'none';

    // Load last weight from localStorage if present
    const weightInput = document.getElementById('weightInput');
    if (weightInput && !weightInput.value) {
      const lastWeight = localStorage.getItem(STORAGE_KEYS.LAST_WEIGHT);
      if (lastWeight) {
        weightInput.value = lastWeight;
        console.log('[DEBUG] Loaded last weight from localStorage:', lastWeight);
      }
    }

    if (addExerciseToListBtn && exerciseEntryDiv) {
      console.log('[DEBUG] Attaching Add Exercise event listener');
      addExerciseToListBtn.addEventListener('click', () => {
        console.log('[DEBUG] Add Exercise button clicked');
        updateDebugBanner('Add Exercise clicked');
        const name = exerciseEntryDiv.querySelector('input[name="exercise"]').value.trim();
        const weight = exerciseEntryDiv.querySelector('input[name="set-weight"]').value;
        const reps = exerciseEntryDiv.querySelector('input[name="set-reps"]').value;
        const time = exerciseEntryDiv.querySelector('input[name="set-time"]').value;
        
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
      window._addExerciseListenerAttached = true;
      updateDebugBanner();
      console.log('[DEBUG] Add Exercise button event listener attached');
    } else {
      window._addExerciseListenerAttached = false;
      updateDebugBanner('Add Exercise button missing');
      console.log('[DEBUG] Add Exercise button or exercise entry div not found');
    }

    if (clearExercisesBtn) {
      clearExercisesBtn.addEventListener('click', () => {
        // Clear form fields with typewriter effect
        const fields = [
          exerciseEntryDiv.querySelector('input[name="exercise"]'),
          exerciseEntryDiv.querySelector('input[name="set-weight"]'),
          exerciseEntryDiv.querySelector('input[name="set-reps"]'),
          exerciseEntryDiv.querySelector('input[name="set-time"]')
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
        if (clearExercisesBtn) {
          clearExercisesBtn.style.display = 'none';
        }
      });
      console.log('[DEBUG] Clear Exercises button event listener attached');
    } else {
      console.log('[DEBUG] Clear Exercises button not found');
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEntry();
      });
      console.log('[DEBUG] Form submit event listener attached');
    } else {
      console.log('[DEBUG] Form not found');
    }

    // Initial setup
    renderExerciseList();
    loadJournal();

    function renderExerciseList() {
      if (!exerciseListUl) return;
      
      exerciseListUl.innerHTML = '';
      
      if (exercises.length === 0) {
        exerciseListUl.innerHTML = '<li class="no-exercises">No exercises added yet</li>';
        if (clearExercisesBtn) clearExercisesBtn.style.display = 'none';
        return;
      }
      
      exercises.forEach((exercise, exerciseIndex) => {
        const li = document.createElement('li');
        li.className = 'exercise-item';
        
        const exerciseName = document.createElement('strong');
        exerciseName.textContent = exercise.name;
        li.appendChild(exerciseName);
        
        if (exercise.sets && exercise.sets.length > 0) {
          const setsList = document.createElement('ul');
          setsList.className = 'sets-list';
          
          exercise.sets.forEach((set, setIndex) => {
            const setLi = document.createElement('li');
            const setDetails = [];
            
            if (set.weight) setDetails.push(`${set.weight} lb`);
            if (set.reps) setDetails.push(`${set.reps} reps`);
            if (set.time) setDetails.push(`${set.time}`);
            
            setLi.textContent = setDetails.join(' × ');
            setsList.appendChild(setLi);
          });
          
          li.appendChild(setsList);
        }
        
        exerciseListUl.appendChild(li);
      });
      
      if (clearExercisesBtn) {
        clearExercisesBtn.style.display = 'block';
      }
    }

    function loadJournal() {
      console.log('[DEBUG] loadJournal called');
      if (!Auth.isAuthenticated()) {
        console.log('[DEBUG] Not authenticated, skipping journal load');
        return;
      }

      console.log('[DEBUG] Loading journal...');
      
      // Load from localStorage first
      const localEntries = LocalStorage.getEntries();
      displayEntries(localEntries);
      
      // Then sync with backend
      API.get('/api/entries')
        .then(response => response.json())
        .then(backendEntries => {
          console.log('[DEBUG] Backend entries loaded:', backendEntries.length);
          
          // Merge local and backend entries
          const mergedEntries = mergeEntries(localEntries, backendEntries);
          
          // Save merged entries locally
          LocalStorage.saveEntries(mergedEntries);
          
          // Display merged entries
          displayEntries(mergedEntries);
          
          // Update last sync time
          LocalStorage.setLastSync();
        })
        .catch(error => {
          console.error('[ERROR] Failed to load from backend:', error);
          // Still show local entries if backend fails
          displayEntries(localEntries);
        });
    }

    // Expose the real loadJournal globally
    window.loadJournal = loadJournal;
    console.log('[DEBUG] window.loadJournal assigned');

    function mergeEntries(localEntries, backendEntries) {
      // Create a map of backend entries by date for quick lookup
      const backendMap = new Map();
      backendEntries.forEach(entry => {
        backendMap.set(entry.date, entry);
      });
      // Merge local entries with backend entries
      const merged = [...localEntries];
      backendEntries.forEach(backendEntry => {
        const localIndex = merged.findIndex(entry => entry.date === backendEntry.date);
        if (localIndex === -1) {
          merged.push(backendEntry);
        } else {
          if (backendEntry.id > merged[localIndex].id) {
            merged[localIndex] = backendEntry;
          }
        }
      });
      // Sort by date ascending
      return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function displayEntries(entries) {
      if (!entriesList) return;
      
      if (entries.length === 0) {
        entriesList.innerHTML = '<li class="no-entries">No journal entries yet. Start by logging your first workout!</li>';
        if (journalSection) journalSection.style.display = 'block';
        if (chartsSection) chartsSection.style.display = 'none';
        return;
      }
      
      entriesList.innerHTML = '';
      
      // Sort entries by date ascending
      const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
      sortedEntries.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'journal-entry';
        // Expand/collapse logic
        const header = document.createElement('div');
        header.className = 'entry-header';
        header.style.cursor = 'pointer';
        // Chevron icon
        const chevron = document.createElement('span');
        chevron.textContent = '▶';
        chevron.style.marginRight = '0.5em';
        header.appendChild(chevron);
        const date = document.createElement('strong');
        date.textContent = new Date(entry.date).toLocaleDateString();
        header.appendChild(date);
        if (entry.bodyWeight) {
          const weight = document.createElement('span');
          weight.className = 'body-weight';
          weight.textContent = `${entry.bodyWeight} lb`;
          header.appendChild(weight);
        }
        if (entry.goals) {
          const goals = document.createElement('span');
          goals.className = 'goals';
          goals.textContent = entry.goals;
          header.appendChild(goals);
        }
        li.appendChild(header);
        // Details section (initially hidden)
        const details = document.createElement('div');
        details.className = 'entry-details';
        details.style.display = 'none';
        if (entry.exercises && entry.exercises.length > 0) {
          const exercisesList = document.createElement('ul');
          exercisesList.className = 'exercises-list';
          entry.exercises.forEach(exercise => {
            const exerciseLi = document.createElement('li');
            exerciseLi.className = 'exercise-entry';
            const exerciseName = document.createElement('strong');
            exerciseName.textContent = exercise.name;
            exerciseLi.appendChild(exerciseName);
            if (exercise.sets && exercise.sets.length > 0) {
              const setsList = document.createElement('ul');
              setsList.className = 'sets-list';
              exercise.sets.forEach(set => {
                const setLi = document.createElement('li');
                const setDetails = [];
                if (set.weight) setDetails.push(`${set.weight} lb`);
                if (set.reps) setDetails.push(`${set.reps} reps`);
                if (set.time) setDetails.push(set.time);
                setLi.textContent = setDetails.join(' × ');
                setsList.appendChild(setLi);
              });
              exerciseLi.appendChild(setsList);
            }
            exercisesList.appendChild(exerciseLi);
          });
          details.appendChild(exercisesList);
        }
        li.appendChild(details);
        // Toggle details on header click
        header.addEventListener('click', () => {
          const isOpen = details.style.display === 'block';
          details.style.display = isOpen ? 'none' : 'block';
          chevron.textContent = isOpen ? '▶' : '▼';
        });
        entriesList.appendChild(li);
      });
      
      if (journalSection) journalSection.style.display = 'block';
      if (chartsSection) chartsSection.style.display = 'block';
      
      // Update chart if Chart.js is available
      if (typeof Chart !== 'undefined') {
        updateChart(sortedEntries);
      }
    }

    function updateChart(entries) {
      const ctx = document.getElementById('progressChart');
      if (!ctx) return;
      // Filter entries with body weight data and sort by date ascending
      const weightEntries = entries.filter(entry => entry.bodyWeight)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 entries
      if (weightEntries.length === 0) return;
      const labels = weightEntries.map(entry => new Date(entry.date).toLocaleDateString());
      const data = weightEntries.map(entry => parseFloat(entry.bodyWeight));
      if (window.weightChart) {
        window.weightChart.destroy();
      }
      window.weightChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Body Weight (lb)',
            data: data,
            borderColor: '#00ff00',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              grid: { color: '#333' },
              ticks: { color: '#fff' }
            },
            x: {
              grid: { color: '#333' },
              ticks: { color: '#fff' }
            }
          },
          plugins: {
            legend: { labels: { color: '#fff' } }
          }
        }
      });
    }

    function saveEntry() {
      if (!Auth.isAuthenticated()) {
        alert('Please log in to save your workout.');
        return;
      }

      console.log('[DEBUG] Saving entry...');
      
      const dateInput = document.getElementById('dateInput');
      const weightInput = document.getElementById('weightInput');
      const goalInput = document.getElementById('goalInput');
      
      if (!dateInput || !weightInput || !goalInput) {
        console.error('[ERROR] Required form elements not found');
        return;
      }
      
      const date = dateInput.value;
      const bodyWeight = weightInput.value;
      const goals = goalInput.value.trim();
      
      console.log('[DEBUG] Form values:', { date, bodyWeight, goals, exercises });
      
      if (!date) {
        alert('Please select a date.');
        return;
      }
      
      if (exercises.length === 0) {
        alert('Please add at least one exercise.');
        return;
      }
      
      // Merge with existing entry for the date if it exists
      const localEntries = LocalStorage.getEntries();
      let entry = localEntries.find(e => e.date === date);
      if (entry) {
        // Merge exercises
        entry.exercises = [...entry.exercises, ...exercises];
        if (bodyWeight) entry.bodyWeight = bodyWeight;
        if (goals) entry.goals = goals;
      } else {
        entry = {
          date,
          bodyWeight: bodyWeight || undefined,
          goals: goals || undefined,
          exercises: [...exercises]
        };
        localEntries.push(entry);
      }
      
      // Save to backend first
      API.post('/api/entries', entry)
        .then(response => response.json())
        .then(savedEntry => {
          console.log('[DEBUG] Entry saved to backend:', savedEntry);
          // Update local entry with backend response (id, etc.)
          const idx = localEntries.findIndex(e => e.date === date);
          if (idx !== -1) localEntries[idx] = savedEntry;
          // Sort by date ascending for display/merge
          localEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
          LocalStorage.saveEntries(localEntries);
          LocalStorage.setLastSync();
          displayEntries(localEntries);
          clearForm();
          showSuccessMessage();
          // Persist last weight to localStorage
          if (bodyWeight) {
            localStorage.setItem(STORAGE_KEYS.LAST_WEIGHT, bodyWeight);
            console.log('[DEBUG] Saved last weight to localStorage:', bodyWeight);
          }
        })
        .catch(error => {
          console.error('[ERROR] Failed to save entry:', error);
          alert('Failed to save entry. Please try again.');
        });
    }

    function syncToBackend(entries) {
      if (!Auth.isAuthenticated()) {
        console.log('[DEBUG] Not authenticated, skipping sync');
        return;
      }

      console.log('[DEBUG] Syncing entries to backend...');
      
      API.post('/api/entries/bulk', { entries })
        .then(response => response.json())
        .then(data => {
          console.log('[DEBUG] Sync successful:', data);
          LocalStorage.setLastSync();
        })
        .catch(error => {
          console.error('[ERROR] Sync failed:', error);
        });
    }

    function syncEntriesIndividually(entries) {
      if (!Auth.isAuthenticated()) {
        console.log('[DEBUG] Not authenticated, skipping sync');
        return;
      }

      console.log('[DEBUG] Syncing entries individually...');
      
      const promises = entries.map(entry => 
        API.post('/api/entries', entry)
          .then(response => response.json())
          .catch(error => {
            console.error('[ERROR] Failed to sync entry:', entry, error);
            return null;
          })
      );
      
      Promise.all(promises)
        .then(results => {
          const successful = results.filter(r => r !== null);
          console.log('[DEBUG] Individual sync completed:', successful.length, 'successful');
          LocalStorage.setLastSync();
        })
        .catch(error => {
          console.error('[ERROR] Individual sync failed:', error);
        });
    }

    function animateAndRemoveEntries(callback) {
      const entries = entriesList.querySelectorAll('li');
      let index = 0;
      
      function animateNext() {
        if (index < entries.length) {
          const entry = entries[index];
          entry.style.transform = 'translateX(-100%)';
          entry.style.opacity = '0';
          entry.style.transition = 'all 0.3s ease';
          
          setTimeout(() => {
            entry.remove();
            index++;
            animateNext();
          }, 100);
        } else {
          if (callback) callback();
        }
      }
      
      animateNext();
    }

    function showSuccessMessage() {
      const message = document.createElement('div');
      message.className = 'success-message';
      message.textContent = 'Workout saved successfully! 💪';
      message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #00ff00;
        color: #000;
        padding: 15px 20px;
        border-radius: 5px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `;
      
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.style.transform = 'translateX(100%)';
        message.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(message);
        }, 300);
      }, 2000);
    }

    function updateExerciseList() {
      renderExerciseList();
    }

    function clearForm() {
      // Clear form fields
      if (dateInput) dateInput.value = '';
      if (weightInput) weightInput.value = '';
      if (goalInput) goalInput.value = '';
      // Clear exercises
      exercises = [];
      renderExerciseList();
      // Do not reset date to today (let user keep editing same date if desired)
    }

  } catch (error) {
    console.error('[ERROR] Failed to initialize app:', error);
  }
}); 