# Render Deployment Guide

This guide will help you deploy your Gym Journal app to Render with PostgreSQL.

## Prerequisites

1. **GitHub Account** - Your code needs to be on GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)

## Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit for Render deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/gymtracker.git
git push -u origin main
```

## Step 2: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the repository containing your `render.yaml`
5. Render will automatically detect and deploy:
   - Backend service
   - PostgreSQL database
   - Environment variables

### Option B: Manual Deployment

1. **Create Database:**
   - Go to Render Dashboard
   - Click "New +" → "PostgreSQL"
   - Name: `gym-journal-db`
   - Plan: Free
   - Click "Create Database"

2. **Create Backend Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory
   - Name: `gym-journal-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

3. **Configure Environment Variables:**
   - NODE_ENV: `production`
   - USE_DB: `true`
   - DATABASE_URL: Copy from your PostgreSQL service

## Step 3: Deploy Frontend

1. **Create Static Site:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select the `frontend` directory
   - Name: `gym-journal-frontend`
   - Build Command: (leave empty)
   - Publish Directory: `.`

2. **Update Frontend API URL:**
   - In `frontend/main.js`, update the API_URL to your backend URL
   - Example: `https://gym-journal-backend.onrender.com/api/entries`

## Step 4: Test Your App

1. Visit your frontend URL
2. Try adding a workout entry
3. Check that data persists (stored in PostgreSQL!)

## Troubleshooting

### Common Issues

1. **Build Fails**: Check build logs in Render dashboard
2. **Database Connection**: Ensure DATABASE_URL is set correctly
3. **CORS Issues**: Backend already has CORS configured
4. **Port Issues**: Render sets PORT automatically

### Useful Commands

```bash
# Check your app status
# Visit your Render dashboard

# View logs
# Available in Render dashboard under your service
```

## Cost

- **Backend**: Free (sleeps after 15 min inactivity)
- **Database**: Free (1GB storage)
- **Frontend**: Free
- **Total**: $0/month

## Next Steps

1. Set up automatic deployments
2. Configure custom domain (optional)
3. Set up monitoring

Your app is now live on Render with persistent PostgreSQL storage! 🎉 