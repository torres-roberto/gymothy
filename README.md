# Gymothy - Fitness Tracking App

A mobile-friendly workout journal web app with a Node.js/Express backend and HTML/CSS/JS frontend. Track your workouts, daily entries, goals, and body weight with a dark monospace theme and Chart.js for progress visualization.

## Features

- **Workout Tracking**: Log exercises with sets, reps, weight, and time
- **Body Weight Monitoring**: Track your weight over time
- **Goal Setting**: Set daily workout goals
- **Progress Charts**: Visualize your fitness journey with Chart.js
- **Mobile-Friendly**: Responsive design that works on all devices
- **Dark Theme**: Easy on the eyes with a monospace aesthetic
- **Collapsible Entries**: Clean, organized journal view

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Storage**: In-memory (development) or PostgreSQL (production)
- **Deployment**: Render (free tier)

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3 (for frontend server)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gymtracker
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm install
   node index.js
   ```
   The backend will run on http://localhost:3000

3. **Start the frontend**
   ```bash
   cd frontend
   python3 -m http.server 8000
   ```
   The frontend will run on http://localhost:8000

4. **Open your browser**
   Navigate to http://localhost:8000 to start using Gymothy!

## Database Configuration

The app supports two storage modes:

### In-Memory Storage (Default)
- Data persists only during the session
- Perfect for testing and development
- Set `USE_DB=false` in environment variables

### PostgreSQL Storage
- Persistent data storage
- Required for production deployment
- Set `USE_DB=true` and provide `DATABASE_URL`

## Deployment

### Render (Recommended - Free)

1. **Fork/Clone** this repository to your GitHub account
2. **Connect** your repository to Render
3. **Deploy** using the provided `render.yaml` configuration
4. **Access** your app at the provided Render URL

The `render.yaml` file automatically configures:
- Backend service with Node.js
- PostgreSQL database
- Environment variables
- Build and start commands

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
USE_DB=true
DATABASE_URL=postgresql://username:password@host:port/database

# Server Configuration
PORT=3000
NODE_ENV=production
```

## API Endpoints

- `GET /api/entries` - Get all workout entries
- `POST /api/entries` - Create a new workout entry
- `DELETE /api/entries` - Delete all entries (reset)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please open an issue on GitHub. 