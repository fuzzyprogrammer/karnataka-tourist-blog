const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/keywords.db');

// Ensure data folder exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT UNIQUE NOT NULL,
      keyword_kannada TEXT,
      language TEXT DEFAULT 'en',
      seed_place TEXT,
      search_volume INTEGER DEFAULT 0,
      keyword_difficulty INTEGER DEFAULT 0,
      cpc REAL DEFAULT 0.0,
      estimated_revenue REAL DEFAULT 0.0,
      competition_level TEXT DEFAULT 'Low',
      serp_title TEXT,
      serp_snippet TEXT,
      domain_recommendations TEXT, -- JSON array
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_id INTEGER,
      rank INTEGER,
      title TEXT,
      url TEXT,
      snippet TEXT,
      domain_authority INTEGER DEFAULT 20,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_id INTEGER,
      seed_place TEXT,
      title_en TEXT,
      title_kn TEXT,
      content_en TEXT,
      content_kn TEXT,
      meta_description_en TEXT,
      meta_description_kn TEXT,
      featured_image_url TEXT,
      featured_image_caption TEXT,
      humanization_score INTEGER DEFAULT 85,
      status TEXT DEFAULT 'draft', -- draft, reviewed, published
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE SET NULL
    )
  `);
});

// Helper query wrappers
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all
};
