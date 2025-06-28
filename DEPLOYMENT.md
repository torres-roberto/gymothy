# Heroku Deployment Guide

This guide will walk you through deploying your Gym Journal app to Heroku.

## Prerequisites

1. **Heroku CLI** - Install from [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)
2. **Git** - Make sure your project is in a Git repository
3. **Node.js** - For local testing

## Step 1: Prepare Your Repository

Make sure your project structure looks like this:
```
gymtracker/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── Procfile
│   └── .gitignore
├── frontend/
│   ├── index.html
│   ├── main.js
│   └── style.css
└── README.md
```

## Step 2: Initialize Git (if not already done)

```bash
cd /path/to/your/gymtracker
git init
git add .
git commit -m "Initial commit"
```

## Step 3: Create Heroku App

```bash
# Login to Heroku (if not already logged in)
heroku login

# Create a new Heroku app
heroku create your-gym-journal-app-name

# Or let Heroku generate a name
heroku create
```

## Step 4: Add PostgreSQL Database

```bash
# Add PostgreSQL addon to your app
heroku addons:create heroku-postgresql:mini

# Verify the database was added
heroku config | grep DATABASE_URL
```

## Step 5: Configure Environment Variables

```bash
# Set the database flag to use PostgreSQL
heroku config:set USE_DB=true

# Set environment to production
heroku config:set NODE_ENV=production

# Verify your config
heroku config
```

## Step 6: Deploy Backend to Heroku

Since Heroku needs the backend files at the root level, we'll deploy from the backend directory:

```bash
# Navigate to backend directory
cd backend

# Create a new Git repository for backend deployment
git init
git add .
git commit -m "Backend for Heroku deployment"

# Add Heroku remote
heroku git:remote -a your-app-name

# Deploy to Heroku
git push heroku main
```

## Step 7: Test Your Backend

```bash
# Check if your app is running
heroku open

# View logs
heroku logs --tail

# Test the API
curl https://your-app-name.herokuapp.com/api/entries
```

## Step 8: Deploy Frontend

For the frontend, you have several options:

### Option A: Deploy to Heroku (Separate App)

```bash
# Create a new Heroku app for frontend
heroku create your-gym-journal-frontend

# Add static buildpack
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static.git

# Create static.json in frontend directory
cd ../frontend
echo '{"root": ".", "clean_urls": true}' > static.json

# Deploy frontend
git init
git add .
git commit -m "Frontend deployment"
heroku git:remote -a your-gym-journal-frontend
git push heroku main
```

### Option B: Deploy to Netlify/Vercel (Recommended)

1. **Netlify**: Drag and drop your `frontend` folder to [netlify.com](https://netlify.com)
2. **Vercel**: Connect your GitHub repo to [vercel.com](https://vercel.com)

### Option C: Use GitHub Pages

```bash
# Push your entire project to GitHub
git remote add origin https://github.com/yourusername/gymtracker.git
git push -u origin main

# Enable GitHub Pages in your repository settings
# Point to the frontend directory
```

## Step 9: Update Frontend API URL

After deploying your backend, update the frontend to point to your Heroku backend:

```javascript
// In frontend/main.js, change the API_BASE_URL
const API_BASE_URL = 'https://your-app-name.herokuapp.com';
```

## Step 10: Test Your Complete App

1. Open your frontend URL
2. Try adding a workout entry
3. Check that data persists (it's now stored in PostgreSQL!)
4. Verify the charts work

## Troubleshooting

### Common Issues

1. **Build Fails**: Check `heroku logs --tail` for error messages
2. **Database Connection**: Ensure `USE_DB=true` is set
3. **CORS Issues**: The backend already has CORS configured
4. **Port Issues**: Heroku sets `PORT` environment variable automatically

### Useful Commands

```bash
# View logs
heroku logs --tail

# Open your app
heroku open

# Check config
heroku config

# Restart app
heroku restart

# Access database (if needed)
heroku pg:psql
```

### Scaling (Optional)

```bash
# Scale to multiple dynos (costs money)
heroku ps:scale web=2

# Check current dyno usage
heroku ps
```

## Cost Considerations

- **Hobby Dyno**: $7/month (sleeps after 30 minutes of inactivity)
- **Basic Dyno**: $14/month (always on)
- **PostgreSQL Mini**: $5/month (included in some plans)

## Next Steps

1. Set up a custom domain (optional)
2. Configure automatic deployments from GitHub
3. Set up monitoring and alerts
4. Consider adding authentication

Your app is now live on the internet with a real PostgreSQL database! 🎉 