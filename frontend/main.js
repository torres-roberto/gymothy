let exercises = [];

const API_URL = 'https://gymothy-6fd370396b25.herokuapp.com/api/entries';

// Logging helper
function log(...args) {
  console.log('[GymTracker]', ...args);
}

// Local storage keys
const STORAGE_KEYS = {
  JOURNAL_ENTRIES: 'gymtracker_journal_entries',
  LAST_SYNC: 'gymtracker_last_sync'
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
  fetch(API_URL, {
    method: 'DELETE'
  })
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

    addExerciseToListBtn.addEventListener('click', () => {
      console.log('[DEBUG] Add Exercise button clicked');
      const name = exerciseEntryDiv.querySelector('input[name="exercise"]').value.trim();
      const weight = exerciseEntryDiv.querySelector('input[name="set-weight"]').value;
      const reps = exerciseEntryDiv.querySelector('input[name="set-reps"]').value;
      const time = exerciseEntryDiv.querySelector('input[name="set-time"]').value;
      
      console.log('[DEBUG] Form values:', { name, weight, reps, time });
      
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
      
      console.log('[DEBUG] New set created:', newSet);
      
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
          typewriterClear(field);
        }, index * 100); // 100ms delay between each field
      });
      
      log('Form cleared for new exercise');
    });

    exerciseListUl.addEventListener('click', (e) => {
      if (e.target.classList.contains('removeExerciseFromList')) {
        const idx = parseInt(e.target.dataset.idx);
        exercises.splice(idx, 1);
        renderExerciseList();
      } else if (e.target.closest('li')) {
        // Click on exercise list item to populate form
        const li = e.target.closest('li');
        const idx = parseInt(li.dataset.idx);
        const exercise = exercises[idx];
        if (exercise) {
          const set = exercise.sets[0];
          exerciseEntryDiv.querySelector('input[name="exercise"]').value = exercise.name;
          exerciseEntryDiv.querySelector('input[name="set-weight"]').value = set.weight || '';
          exerciseEntryDiv.querySelector('input[name="set-reps"]').value = set.reps || '';
          exerciseEntryDiv.querySelector('input[name="set-time"]').value = set.time || '';
          log('Exercise loaded into form', exercise);
        }
      }
    });

    function renderExerciseList() {
      exerciseListUl.innerHTML = '';
      exercises.forEach((ex, idx) => {
        const li = document.createElement('li');
        li.dataset.idx = idx;
        li.style.cursor = 'pointer';
        li.className = 'entry-card';
        const set = ex.sets[0];
        let displayText = `<strong>${ex.name}</strong>`;
        displayText += ((set.weight !== undefined && set.weight !== '') ? ` | Weight: ${set.weight}lb` : '');
        displayText += ((set.reps !== undefined && set.reps !== '') ? ` | Reps: ${set.reps}` : '');
        displayText += ((set.time !== undefined && set.time !== '') ? ` | Time: ${set.time}` : '');
        if (ex.sets.length > 1) {
          displayText += ` | Sets: ${ex.sets.length}`;
        }
        li.innerHTML = displayText + ` <button type="button" class="removeExerciseFromList" data-idx="${idx}">Remove</button>`;
        exerciseListUl.appendChild(li);
      });
      
      // Show/hide New Exercise button based on exercise list with smooth transition
      if (exercises.length > 0) {
        clearExercisesBtn.style.display = 'block';
        // Use setTimeout to ensure display: block is applied before adding the show class
        setTimeout(() => {
          clearExercisesBtn.classList.add('show');
        }, 10);
      } else {
        clearExercisesBtn.classList.remove('show');
        // Hide the button after transition completes
        setTimeout(() => {
          if (exercises.length === 0) {
            clearExercisesBtn.style.display = 'none';
          }
        }, 300);
      }
    }

    form.addEventListener('submit', async (e) => {
      console.log('[DEBUG] Form submit event triggered');
      e.preventDefault();
      console.log('[DEBUG] Calling saveEntry function');
      saveEntry();
    });

    function loadJournal() {
      console.log('[DEBUG] Loading journal entries...');
      
      // First try to load from backend
      fetch(API_URL)
        .then(response => {
          console.log('[DEBUG] Backend response status:', response.status);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(backendEntries => {
          console.log('[DEBUG] Backend entries loaded:', backendEntries);
          
          // Get local entries
          const localEntries = LocalStorage.getEntries();
          console.log('[DEBUG] Local entries loaded:', localEntries);
          
          // Merge and display
          const mergedEntries = mergeEntries(localEntries, backendEntries);
          console.log('[DEBUG] Merged entries:', mergedEntries);
          
          displayEntries(mergedEntries);
          
          // Sync to backend if we have local entries
          if (localEntries.length > 0) {
            console.log('[DEBUG] Syncing local entries to backend...');
            syncToBackend(mergedEntries);
          }
        })
        .catch(error => {
          console.error('[ERROR] Failed to load from backend:', error);
          console.log('[DEBUG] Falling back to local storage...');
          
          // Fallback to local storage
          const localEntries = LocalStorage.getEntries();
          displayEntries(localEntries);
        });
    }

    // Merge local and backend entries, preferring local for conflicts
    function mergeEntries(localEntries, backendEntries) {
      const merged = [...localEntries];
      
      backendEntries.forEach(backendEntry => {
        const existingIndex = merged.findIndex(entry => entry.date === backendEntry.date);
        if (existingIndex === -1) {
          // Add backend entry if no local entry exists for this date
          merged.push(backendEntry);
        }
        // If local entry exists, keep it (local takes precedence)
      });
      
      return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function displayEntries(entries) {
      console.log('[DEBUG] displayEntries called with:', entries);
      entriesList.innerHTML = '';
      
      if (entries.length > 0) {
        if (journalSection) journalSection.style.display = '';
        if (chartsSection) chartsSection.style.display = '';
      } else {
        if (journalSection) journalSection.style.display = 'none';
        if (chartsSection) chartsSection.style.display = 'none';
      }
      
      // Display entries (already merged and sorted)
      entries.forEach((entry, idx) => {
        const li = document.createElement('li');
        li.className = 'journal-entry';
        
        // Build header text (date, weight, goal)
        let headerText = `<span class='entry-arrow' style='display:inline-block;transition:transform 0.2s;'>&#9660;</span> <strong>Date:</strong> ${entry.date}`;
        if (entry.bodyWeight && entry.bodyWeight !== 'undefined' && entry.bodyWeight !== 'null' && entry.bodyWeight !== '' && entry.bodyWeight !== undefined && entry.bodyWeight !== null && entry.bodyWeight.toString().trim() !== '') {
          headerText += ` &nbsp; <strong>Body Weight:</strong> ${entry.bodyWeight}lb`;
        }
        if (entry.goals && entry.goals !== 'undefined' && entry.goals !== 'null' && entry.goals !== '' && entry.goals !== undefined && entry.goals !== null && entry.goals.toString().trim() !== '') {
          headerText += ` &nbsp; <strong>Goal:</strong> ${entry.goals}`;
        }
        
        // Collapsible content (exercises)
        let detailsHtml = '';
        if (entry.exercises && entry.exercises.length > 0) {
          detailsHtml += '<ul class="entry-details" style="margin:0.5em 0 0.5em 1.5em; padding:0;">';
          entry.exercises.forEach(ex => {
            detailsHtml += `<li style="background:none; border:none; padding:0; color:inherit; font-size:inherit;">
              <strong>${ex.name}</strong>:
                <ul style='margin:0.2em 0 0.2em 1.5em; padding:0;'>`;
            ex.sets.forEach(set => {
              let setText = '';
              if (set.weight !== undefined && set.weight !== '' && set.weight !== 'undefined' && set.weight !== null) {
                setText += `Weight: ${set.weight}lb, `;
              }
              if (set.reps !== undefined && set.reps !== '' && set.reps !== 'undefined' && set.reps !== null) {
                setText += `Reps: ${set.reps}, `;
              }
              if (set.time !== undefined && set.time !== '' && set.time !== 'undefined' && set.time !== null) {
                setText += `Time: ${set.time}`;
              }
              setText = setText.replace(/, $/, '');
              if (setText) {
                detailsHtml += `<li style='background:none; border:none; padding:0; color:inherit; font-size:inherit;'>${setText}</li>`;
              }
            });
            detailsHtml += `</ul></li>`;
          });
          detailsHtml += '</ul>';
        }
        
        // Compose entry HTML
        li.innerHTML = `<div class='entry-header' style='cursor:pointer;user-select:none;'>${headerText}</div><div class='entry-content' style='display:block;'>${detailsHtml}</div>`;
        
        // Collapsible logic
        const headerDiv = li.querySelector('.entry-header');
        const contentDiv = li.querySelector('.entry-content');
        const arrow = li.querySelector('.entry-arrow');
        let expanded = true;
        headerDiv.addEventListener('click', () => {
          expanded = !expanded;
          contentDiv.style.display = expanded ? 'block' : 'none';
          arrow.style.transform = expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
        });
        // Start expanded
        contentDiv.style.display = 'block';
        arrow.style.transform = 'rotate(0deg)';
        
        entriesList.appendChild(li);
      });
      
      console.log('[DEBUG] Display updated');
    }

    function updateChart(entries) {
      const ctx = document.getElementById('progressChart').getContext('2d');
      if (window.progressChart) window.progressChart.destroy();
      // Example: chart weight over time
      const labels = entries.map(e => e.date);
      const weights = entries.map(e => e.bodyWeight).filter(w => w && w !== null && w !== undefined);
      window.progressChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Body Weight (lb)',
            data: weights,
            borderColor: '#007bff',
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: true } }
        }
      });
    }

    function saveEntry() {
      console.log('[DEBUG] saveEntry called');
      console.log('[DEBUG] exercises array:', exercises);
      
      if (exercises.length === 0) {
          console.log('[DEBUG] No exercises found, showing alert');
          alert('Please add at least one exercise before saving.');
          return;
      }

      // Get form values and filter out empty/undefined values
      const dateValue = document.getElementById('dateInput').value;
      const weightValue = document.getElementById('weightInput').value;
      const goalValue = document.getElementById('goalInput').value;
      
      console.log('[DEBUG] Form values:', { dateValue, weightValue, goalValue });

      const newEntry = {
          date: dateValue,
          exercises: exercises,
          bodyWeight: weightValue && weightValue.trim() !== '' ? weightValue : null,
          // If goal is blank, set to null (not undefined or empty string)
          goals: goalValue && goalValue.trim() !== '' ? goalValue : null,
          id: Date.now() // Generate unique ID
      };
      
      console.log('[DEBUG] New entry object:', newEntry);

      // Get existing entries from local storage
      const existingEntries = LocalStorage.getEntries();
      console.log('[DEBUG] Existing entries from localStorage:', existingEntries);

      // Find existing entry for the same date
      const existingEntryIndex = existingEntries.findIndex(entry => entry.date === dateValue);
      
      if (existingEntryIndex !== -1) {
        // Update existing entry for the same date
        console.log('[DEBUG] Found existing entry for date, merging...');
        const existingEntry = existingEntries[existingEntryIndex];
        
        // Merge body weight (prefer new value if present)
        existingEntry.bodyWeight = newEntry.bodyWeight || existingEntry.bodyWeight;
        // Overwrite goal: if newEntry.goals is null, remove the property
        if (newEntry.goals === null) {
          delete existingEntry.goals;
        } else {
          existingEntry.goals = newEntry.goals;
        }
        
        // Merge exercises
        newEntry.exercises.forEach(newExercise => {
          const existingExerciseIndex = existingEntry.exercises.findIndex(ex => ex.name === newExercise.name);
          if (existingExerciseIndex !== -1) {
            // Add sets to existing exercise
            existingEntry.exercises[existingExerciseIndex].sets = existingEntry.exercises[existingExerciseIndex].sets.concat(newExercise.sets);
          } else {
            // Add new exercise
            existingEntry.exercises.push(newExercise);
          }
        });
        
        // Update the entry
        existingEntries[existingEntryIndex] = existingEntry;
        console.log('[DEBUG] Updated existing entry:', existingEntry);
      } else {
        // Create new entry for the date
        console.log('[DEBUG] Creating new entry for date');
        existingEntries.push(newEntry);
      }

      // Save to local storage immediately for fast response
      LocalStorage.saveEntries(existingEntries);
      
      // Update display immediately
      displayEntries(existingEntries);
      
      console.log('[DEBUG] Starting animation...');
      
      // Animate and remove entry cards
      animateAndRemoveEntries(() => {
        console.log('[DEBUG] Animation completed, clearing form...');
        // After animation, clear form and exercises
        exercises = [];
        renderExerciseList(); // This will clear the UI
        clearForm();
        
        showSuccessMessage();
        console.log('[DEBUG] Form cleared and journal updated');
        
        // Sync to backend in background
        syncToBackend(existingEntries);
      });
      // Also clear the exercise list UI immediately after save (in case of fast user interaction)
      exercises = [];
      renderExerciseList();
    }

    // Background sync to backend
    function syncToBackend(entries) {
      console.log('[DEBUG] Syncing entries to backend:', entries);
      
      // First clear backend
      fetch(API_URL, {
        method: 'DELETE'
      })
      .then(() => {
        // Then bulk upload
        return fetch(`${API_URL}/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ entries })
        });
      })
      .then(response => response.json())
      .then(data => {
        console.log('[DEBUG] Backend sync successful:', data);
        LocalStorage.setLastSync();
      })
      .catch(error => {
        console.error('[ERROR] Backend sync failed:', error);
      });
    }

    function syncEntriesIndividually(entries) {
      console.log('[DEBUG] Syncing entries individually to backend:', entries);
      
      // Clear backend first
      fetch(API_URL, {
        method: 'DELETE'
      })
      .then(() => {
        // Then add each entry individually
        const promises = entries.map(entry => 
          fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
          })
        );
        
        return Promise.all(promises);
      })
      .then(responses => {
        console.log('[DEBUG] Individual sync successful:', responses.length, 'entries');
        LocalStorage.setLastSync();
      })
      .catch(error => {
        console.error('[ERROR] Individual sync failed:', error);
      });
    }

    function animateAndRemoveEntries(callback) {
      console.log('[DEBUG] animateAndRemoveEntries called');
      const cards = document.querySelectorAll('#exerciseList .entry-card');
      console.log('[DEBUG] Found cards to animate:', cards.length);
      
      if (cards.length === 0) {
        console.log('[DEBUG] No cards found, calling callback immediately');
        callback();
        return;
      }
      
      let finished = 0;
      cards.forEach((card, i) => {
        console.log(`[DEBUG] Animating card ${i + 1}/${cards.length}`);
        setTimeout(() => {
          card.classList.add('roll-up');
          card.addEventListener('animationend', () => {
            console.log(`[DEBUG] Card ${i + 1} animation ended, removing from DOM`);
            card.remove();
            finished++;
            console.log(`[DEBUG] Finished cards: ${finished}/${cards.length}`);
            if (finished === cards.length) {
              console.log('[DEBUG] All cards finished, calling callback');
              setTimeout(callback, 200); // small delay after last card
            }
          }, { once: true });
        }, i * 150);
      });
    }

    function showSuccessMessage() {
      console.log('[DEBUG] showSuccessMessage called');
      const msg = document.createElement('div');
      msg.className = 'success-message';
      msg.textContent = 'Workout Saved! 💪';
      document.body.appendChild(msg);
      console.log('[DEBUG] Success message added to DOM');
      setTimeout(() => {
        msg.remove();
        console.log('[DEBUG] Success message removed from DOM');
      }, 1500);
    }

    function updateExerciseList() {
      renderExerciseList();
    }

    function clearForm() {
      // Clear form fields with typewriter effect
      const fields = [
          document.querySelector('input[name="exercise"]'),
          document.querySelector('input[name="set-weight"]'),
          document.querySelector('input[name="set-reps"]'),
          document.querySelector('input[name="set-time"]'),
          document.getElementById('weightInput'),
          document.getElementById('goalInput')
      ];
      
      // Clear fields with staggered timing for a nice effect
      fields.forEach((field, index) => {
          if (field) {
              setTimeout(() => {
                  if (field.type === 'date') {
                      // Set date back to today
                      const today = new Date().toISOString().split('T')[0];
                      field.value = today;
                  } else {
                      typewriterClear(field);
                  }
              }, index * 100); // 100ms delay between each field
          }
      });
      
      log('Form cleared for new exercise');
    }

    loadJournal();
  } catch (error) {
    console.error('[ERROR] Error initializing app:', error);
  }
}); 