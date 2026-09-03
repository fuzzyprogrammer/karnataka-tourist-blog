# Karnataka Tourist Blog - Local Setup Guide

## Architecture
- **Backend**: Runs locally on `http://localhost:3001`
- **Frontend**: Deployed on Vercel (production) OR runs locally on `http://localhost:5173`
- **Database**: SQLite stored locally in `data/keywords.db`
- **Git**: All changes tracked and pushed to GitHub

## Prerequisites
- Node.js 18+
- npm or yarn
- Git
- (Optional) Vercel CLI for frontend deployment

## Local Development Setup

### 1. Install Dependencies
```bash
cd D:\projects\antigravity
npm run install:all
```

### 2. Configure Environment
Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

### 3. Run Backend (Terminal 1)
```bash
cd backend
npm start
```
Backend will run on: `http://localhost:3001`

### 4. Run Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5173`

### 5. Update Frontend API URL (if needed)
In `frontend/src/App.jsx`, the API_BASE is already configured to:
- Use `http://localhost:3001/api` when running locally
- Use `/api` when deployed on Vercel (for local backend testing)

## Production Deployment

### Deploy Frontend to Vercel
```bash
# Build frontend
npm run build:frontend

# Deploy to Vercel
vercel --prod
```

### Connect to Local Backend (Optional)
If you want the deployed frontend to connect to your local backend:
1. Use ngrok or similar to expose localhost
2. Update `frontend/src/App.jsx` API_BASE to ngrok URL

## Workflow

### Mining Keywords
1. Start backend locally
2. Open frontend (localhost:5173 or Vercel)
3. Select place and click "Start Keyword Mining"
4. Keywords saved to `data/keywords.db`

### Generating Blog Articles
1. Select a keyword from the mined list
2. Click "Generate Article"
3. Review and edit the generated content
4. Publish or export as Markdown

### Git Workflow
```bash
# After making changes
git add .
git commit -m "feat: description of changes"
git push origin master

# Build and deploy frontend
npm run build:frontend
vercel --prod
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seed-places` | Get list of 50 Karnataka tourist places |
| GET | `/api/keywords/stats` | Get keyword statistics |
| GET | `/api/keywords` | Get all mined keywords |
| POST | `/api/keywords/mine` | Mine keywords for places |
| POST | `/api/keywords/clear` | Clear all keywords |
| GET | `/api/export/csv` | Export keywords as CSV |
| GET | `/api/articles` | Get all articles |
| POST | `/api/articles/generate` | Generate article from keyword |
| PUT | `/api/articles/:id` | Update article |
| DELETE | `/api/articles/:id` | Delete article |
| GET | `/api/articles/preview/:id` | View live blog post |
| GET | `/api/articles/:id/markdown` | Export article as Markdown |

## Data Storage
- **Database**: `data/keywords.db` (SQLite)
- **Logs**: Console output only
- **Backups**: Commit database to git or export as CSV

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm start
```

### Frontend can't connect
- Check if backend is running on port 3001
- Check API_BASE in `frontend/src/App.jsx`
- Ensure CORS is enabled (already configured)

### Database locked
- Close any other processes using the database
- Check file permissions

## Next Steps
1. Run `npm start` to begin local development
2. Mine keywords for your target places
3. Generate and review AI articles
4. Export as Markdown for your blog
5. Deploy frontend to Vercel when ready
