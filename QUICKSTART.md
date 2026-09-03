# Local Development Script

## Quick Start
```powershell
# Install all dependencies
npm run install:all

# Start backend and frontend
npm start
```

## Separate Commands
```powershell
# Backend only (Terminal 1)
npm run backend

# Frontend only (Terminal 2)
npm run frontend

# Build and deploy frontend to Vercel
npm run deploy
```

## After Changes
```powershell
# Commit and push
git add .
git commit -m "feat: description"
git push origin master

# Deploy frontend
npm run build:frontend
vercel --prod
```
