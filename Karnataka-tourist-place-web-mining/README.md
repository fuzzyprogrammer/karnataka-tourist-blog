# Karnataka Tourist Place Web Mining (Micro-Niche Keyword Finder)

A specialized bilingual (English + ಕನ್ನಡ) keyword research & web mining system designed to find high-volume, low-competition tourist keywords specifically for Karnataka state, targeting $1,000+/month AdSense micro-niche site creation.

Powered by the **Obscura Headless Browser Engine (Rust)**.

---

## 🌟 Key Features

1. **50 Seed Places**: Pre-loaded with Karnataka's top 50 tourist destinations (Hampi, Mysore, Coorg, Gokarna, Badami, etc.).
2. **Bilingual Mining**: Mines keywords in both **English** and **Kannada (ಕನ್ನಡ)**.
3. **Keyword Metrics Engine**: Calculates Search Volume, Keyword Difficulty (KD), CPC ($), and Estimated Monthly AdSense Revenue.
4. **Domain Recommendations**: Auto-generates available `.com`, `.in`, `.org` micro-niche domain name ideas.
5. **Content Outline Generator**: 1-click copyable SEO article structure ready for website generation.
6. **Obscura Browser Support**: Low-memory (30MB) stealth browser integration via Chrome DevTools Protocol (CDP).
7. **CSV Export**: Direct download of mined keywords table.

---

## 🚀 How to Run

### 1. Start the Backend API
```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### 2. Start the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. (Optional) Run Obscura CDP Browser Engine
Download the Obscura binary from [Obscura Releases](https://github.com/h4ckf0r0day/obscura/releases) into `obscura/` directory:
```bash
cd obscura
./obscura serve --port 9222 --stealth
```

---

## 📁 Directory Structure

```
Karnataka-tourist-place-web-mining/
├── backend/
│   ├── src/
│   │   ├── scrapers/          # Google Suggest & SERP Analyzers
│   │   ├── services/          # Obscura CDP Manager
│   │   ├── db.js              # SQLite Database Handler
│   │   └── index.js           # Express API Server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React Dashboard
│   │   └── index.css          # Tailwind CSS v4 Styles
│   └── vite.config.js
├── data/
│   └── keywords.db            # SQLite Mined Data Storage
├── seed-keywords.json         # 50 Karnataka Tourist Places
└── README.md
```
