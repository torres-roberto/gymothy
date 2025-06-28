# Deploying Gymothy to Render

This guide will help you deploy Gymothy to Render's free tier, which includes:
- Backend service (Node.js/Express)
- PostgreSQL database (1GB storage)
- Frontend hosting (static files)

## Prerequisites

1. A GitHub account
2. A Render account (free at [render.com](https://render.com))

## Step 1: Prepare Your Repository

1. **Fork or clone** this repository to your GitHub account
2. **Remove nested git repositories** (if any):
   ```bash
   rm -rf backend/.git frontend/.git
   ```
3. **Initialize a new git repository** in the root directory:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Gymothy"
   ```
4. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy on Render

1. **Sign in to Render** at [render.com](https://render.com)
2. **Click "New +"** and select "Blueprint"
3. **Connect your GitHub repository**
4. **Select the repository** containing Gymothy
5. **Render will automatically detect** the `render.yaml` configuration
6. **Click "Apply"** to start the deployment

## Step 3: Configuration

The `render.yaml` file automatically configures:

### Backend Service
- **Name**: `gymothy-backend`
- **Environment**: Node.js
- **Plan**: Free
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `NODE_ENV=production`
  - `USE_DB=true`
  - `DATABASE_URL` (automatically set from database)

### Database
- **Name**: `gymothy-db`
- **Database Name**: `gymothy`
- **User**: `gymothy`
- **Plan**: Free (1GB storage)

## Step 4: Access Your App

1. **Wait for deployment** (usually 2-5 minutes)
2. **Find your backend URL** in the Render dashboard
3. **Update frontend configuration** to point to your backend:
   - Edit `frontend/main.js`
   - Change the API base URL to your Render backend URL
4. **Deploy frontend** (optional - you can serve it from Render or use GitHub Pages)

## Environment Variables

The following environment variables are automatically configured:

```env
NODE_ENV=production
USE_DB=true
DATABASE_URL=postgresql://gymothy:password@host:port/gymothy
```

## Free Tier Limitations

- **Backend**: Sleeps after 15 minutes of inactivity
- **Database**: 1GB storage limit
- **Bandwidth**: 750GB/month
- **Build minutes**: 500/month

## Troubleshooting

### Common Issues

1. **Build fails**: Check that all dependencies are in `package.json`
2. **Database connection fails**: Verify `DATABASE_URL` is set correctly
3. **CORS errors**: Ensure frontend URL is allowed in backend CORS configuration

### Logs

- View logs in the Render dashboard under your service
- Check both build logs and runtime logs
- Common log locations:
  - Build logs: Service → Logs → Build
  - Runtime logs: Service → Logs → Live

## Updating Your App

1. **Make changes** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
3. **Render automatically redeploys** when it detects changes

## Cost

- **Free tier**: $0/month
- **Upgrades available** if you need more resources
- **No credit card required** for free tier

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: [community.render.com](https://community.render.com)
- **GitHub Issues**: For Gymothy-specific issues 