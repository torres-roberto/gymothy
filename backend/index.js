require('dotenv').config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const USE_DB = process.env.USE_DB === 'true';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

let journalEntries = [];
let users = new Map(); // Store user data by email
let pool;
if (USE_DB) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

// Helper: ensure tables exist
async function ensureTables() {
  if (!USE_DB) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS journal_entries (
    id BIGINT PRIMARY KEY,
    user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
    date TEXT NOT NULL,
    data JSONB NOT NULL
  )`);
}

// Helper: convert DB rows to entry objects
function rowToEntry(row) {
  return { ...row.data, id: row.id, date: row.date };
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Google OAuth Strategy
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogleCredentials) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = {
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value
      };

      if (USE_DB) {
        await ensureTables();
        await pool.query(
          'INSERT INTO users (email, name, picture) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = $2, picture = $3',
          [user.email, user.name, user.picture]
        );
      } else {
        users.set(user.email, user);
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth credentials not provided - OAuth routes will be disabled');
}

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  try {
    if (USE_DB) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      done(null, result.rows[0]);
    } else {
      done(null, users.get(email));
    }
  } catch (error) {
    done(error, null);
  }
});

// Auth routes
if (hasGoogleCredentials) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign({ email: req.user.email, name: req.user.name }, JWT_SECRET, { expiresIn: '7d' });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000';
      const redirectUrl = `${frontendUrl}?token=${token}`;
      console.log('[DEBUG] OAuth callback - FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('[DEBUG] OAuth callback - frontendUrl:', frontendUrl);
      console.log('[DEBUG] OAuth callback - redirectUrl:', redirectUrl);
      res.redirect(redirectUrl);
    }
  );
} else {
  // Mock OAuth routes for testing
  app.get('/auth/google', (req, res) => {
    res.status(503).json({ error: 'OAuth not configured for testing' });
  });
  
  app.get('/auth/google/callback', (req, res) => {
    res.status(503).json({ error: 'OAuth not configured for testing' });
  });
}

app.get('/auth/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Protected API routes
app.delete('/api/entries', authenticateToken, async (req, res) => {
  if (USE_DB) {
    await ensureTables();
    await pool.query('DELETE FROM journal_entries WHERE user_email = $1', [req.user.email]);
    res.status(200).json({ message: 'All entries cleared (db)' });
  } else {
    journalEntries = journalEntries.filter(entry => entry.userEmail !== req.user.email);
    res.status(200).json({ message: 'All entries cleared (memory)' });
  }
});

app.post('/api/entries', authenticateToken, async (req, res) => {
  const entry = req.body;
  entry.id = Date.now();
  entry.userEmail = req.user.email;
  
  if (USE_DB) {
    await ensureTables();
    await pool.query(
      'INSERT INTO journal_entries (id, user_email, date, data) VALUES ($1, $2, $3, $4)',
      [entry.id, req.user.email, entry.date, entry]
    );
    res.status(201).json(entry);
  } else {
    journalEntries.push(entry);
    res.status(201).json(entry);
  }
});

app.post('/api/entries/bulk', authenticateToken, async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Entries must be an array' });
  }
  
  if (USE_DB) {
    await ensureTables();
    await pool.query('DELETE FROM journal_entries WHERE user_email = $1', [req.user.email]);
    for (const entry of entries) {
      await pool.query(
        'INSERT INTO journal_entries (id, user_email, date, data) VALUES ($1, $2, $3, $4)',
        [entry.id || Date.now() + Math.random(), req.user.email, entry.date, entry]
      );
    }
    res.status(200).json({ message: `${entries.length} entries saved (db)`, count: entries.length });
  } else {
    journalEntries = journalEntries.filter(entry => entry.userEmail !== req.user.email);
    const userEntries = entries.map(entry => ({
      ...entry,
      id: entry.id || Date.now() + Math.random(),
      userEmail: req.user.email
    }));
    journalEntries.push(...userEntries);
    res.status(200).json({ message: `${entries.length} entries saved (memory)`, count: entries.length });
  }
});

app.get('/api/entries', authenticateToken, async (req, res) => {
  if (USE_DB) {
    await ensureTables();
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE user_email = $1 ORDER BY date DESC',
      [req.user.email]
    );
    res.json(result.rows.map(rowToEntry));
  } else {
    const userEntries = journalEntries.filter(entry => entry.userEmail === req.user.email);
    res.json(userEntries);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  if (USE_DB) {
    console.log('Using PostgreSQL for storage');
  } else {
    console.log('Using in-memory storage');
  }
  console.log('Google OAuth enabled');
}); 