# Gym Journal

A mobile-friendly workout journal web app with a Node.js/Express backend and HTML/CSS/JS frontend. Track workouts (sets, reps, weight), daily entries, goals, and body weight with a dark monospace theme and Chart.js for progress visualization.

## Features

- **Workout Tracking**: Log exercises with sets, reps, and weight in pounds
- **Daily Journal**: Track body weight, goals, and workout summaries
- **Progress Charts**: Visualize your fitness journey with Chart.js
- **Mobile-Friendly**: Responsive design that works on all devices
- **Collapsible Entries**: Journal entries can be expanded/collapsed for better organization
- **Database Support**: Switch between in-memory storage (for testing) and PostgreSQL (for production)

## Database Configuration

The app supports two storage modes:

### In-Memory Storage (Default - for local testing)
```bash
cd backend
node index.js
```
This uses the default configuration with in-memory storage. Perfect for local development and testing.

### PostgreSQL Storage (for production)
```bash
cd backend
USE_DB=true DATABASE_URL=your_postgres_url node index.js
```

#### Environment Variables
- `USE_DB`: Set to `'true'` to use PostgreSQL, `'false'` or unset for in-memory
- `DATABASE_URL`: PostgreSQL connection string (required when `USE_DB=true`)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

#### Example Configuration
Copy `backend/env.example` to `backend/.env` and modify:
```bash
# For local testing
USE_DB=false

# For production with PostgreSQL
USE_DB=true
DATABASE_URL=postgresql://username:password@localhost:5432/gymtracker
```

## Setup

### Prerequisites
- Node.js
- Python 3 (for frontend server)
- PostgreSQL (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gymtracker
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   node index.js
   ```
   The backend will run on `http://localhost:3000`

2. **Start the frontend server** (in a new terminal)
   ```bash
   cd frontend
   python3 -m http.server 8000
   ```
   The frontend will be available at `http://localhost:8000`

## API Endpoints

- `GET /api/entries` - Get all journal entries
- `POST /api/entries` - Create a new journal entry
- `POST /api/entries/bulk` - Bulk create/update entries
- `DELETE /api/entries` - Clear all entries (for testing)

## Deployment

### Heroku Deployment
1. Create a Heroku app
2. Add PostgreSQL addon: `heroku addons:create heroku-postgresql:mini`
3. Set environment variables:
   ```bash
   heroku config:set USE_DB=true
   heroku config:set NODE_ENV=production
   ```
4. Deploy your backend to Heroku
5. Update frontend API URL to point to your Heroku backend

### Local PostgreSQL Setup
1. Install PostgreSQL
2. Create a database: `createdb gymtracker`
3. Set environment variables:
   ```bash
   export USE_DB=true
   export DATABASE_URL=postgresql://username:password@localhost:5432/gymtracker
   ```
4. Run the backend: `node index.js`

## Development

The app is designed to be easily switchable between storage modes:
- **Local Development**: Use in-memory storage for quick testing
- **Production**: Use PostgreSQL for persistent data storage
- **Testing**: Use in-memory storage for isolated testing

## License

MIT License 