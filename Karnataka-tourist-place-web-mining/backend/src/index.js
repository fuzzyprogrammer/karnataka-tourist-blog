require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { expandTouristKeywords } = require('./scrapers/googleSuggest');
const { calculateMetrics, generateDomainRecommendations } = require('./scrapers/serpAnalyzer');
const obscura = require('./services/obscura');
const { generateArticle } = require('./services/gemini');
const { fetchPlaceImage } = require('./services/media');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load seed places
const seedPlacesPath = path.resolve(__dirname, '../../seed-keywords.json');
let seedPlaces = [];
if (fs.existsSync(seedPlacesPath)) {
  seedPlaces = JSON.parse(fs.readFileSync(seedPlacesPath, 'utf8'));
}

// 1. Get seed places list
app.get('/api/seed-places', (req, res) => {
  res.json({ success: true, count: seedPlaces.length, places: seedPlaces });
});

// 2. Overview statistics
app.get('/api/keywords/stats', async (req, res) => {
  try {
    const totalKw = await db.get('SELECT COUNT(*) as count FROM keywords');
    const easyKw = await db.get('SELECT COUNT(*) as count FROM keywords WHERE keyword_difficulty <= 30');
    const highRev = await db.get('SELECT COUNT(*) as count FROM keywords WHERE estimated_revenue >= 100');
    const kannadaCount = await db.get("SELECT COUNT(*) as count FROM keywords WHERE language = 'kn'");
    const totalRev = await db.get('SELECT SUM(estimated_revenue) as total FROM keywords');

    res.json({
      total_keywords: totalKw?.count || 0,
      easy_difficulty: easyKw?.count || 0,
      high_revenue_count: highRev?.count || 0,
      kannada_keywords: kannadaCount?.count || 0,
      total_potential_revenue: totalRev?.total ? Math.round(totalRev.total) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Mine keywords for a specific place or all places
app.post('/api/keywords/mine', async (req, res) => {
  const { placeName } = req.body; // If undefined, process first 5 places or specified place

  let targetPlaces = [];
  if (placeName) {
    targetPlaces = seedPlaces.filter(p => p.en.toLowerCase() === placeName.toLowerCase());
  } else {
    // Default mine top 10 places if not specified
    targetPlaces = seedPlaces.slice(0, 10);
  }

  if (targetPlaces.length === 0) {
    return res.status(400).json({ error: 'Place not found in seed list' });
  }

  res.json({ success: true, message: `Started keyword mining for ${targetPlaces.length} places in background.` });

  // Process asynchronously
  (async () => {
    console.log(`[Miner] Starting keyword mining for ${targetPlaces.length} places...`);
    for (const place of targetPlaces) {
      try {
        console.log(`[Miner] Mining: ${place.en}`);
        const keywords = await expandTouristKeywords(place.en, place.kn);

        for (const item of keywords) {
          const metrics = calculateMetrics(item.keyword, item.language);
          const domainRecs = generateDomainRecommendations(item.keyword, place.en);

          await db.run(
            `INSERT OR IGNORE INTO keywords 
            (keyword, keyword_kannada, language, seed_place, search_volume, keyword_difficulty, cpc, estimated_revenue, competition_level, domain_recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.keyword,
              item.language === 'kn' ? item.keyword : place.kn,
              item.language,
              place.en,
              metrics.search_volume,
              metrics.keyword_difficulty,
              metrics.cpc,
              metrics.estimated_revenue,
              metrics.competition_level,
              JSON.stringify(domainRecs)
            ]
          );
        }
      } catch (err) {
        console.error(`[Miner] Failed for ${place.en}:`, err.message);
      }
    }
    console.log('[Miner] Mining process completed!');
  })();
});

// 4. Fetch keywords table with filters
app.get('/api/keywords', async (req, res) => {
  try {
    const { lang, maxKd, minVolume, seedPlace, search } = req.query;

    let query = 'SELECT * FROM keywords WHERE 1=1';
    const params = [];

    if (lang) {
      query += ' AND language = ?';
      params.push(lang);
    }
    if (maxKd) {
      query += ' AND keyword_difficulty <= ?';
      params.push(parseInt(maxKd));
    }
    if (minVolume) {
      query += ' AND search_volume >= ?';
      params.push(parseInt(minVolume));
    }
    if (seedPlace) {
      query += ' AND seed_place = ?';
      params.push(seedPlace);
    }
    if (search) {
      query += ' AND (keyword LIKE ? OR seed_place LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY estimated_revenue DESC LIMIT 200';

    const rows = await db.all(query, params);
    const formatted = rows.map(r => ({
      ...r,
      domain_recommendations: JSON.parse(r.domain_recommendations || '[]')
    }));

    res.json({ count: formatted.length, keywords: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Clear all mined keywords
app.post('/api/keywords/clear', async (req, res) => {
  try {
    await db.run('DELETE FROM keywords');
    await db.run('DELETE FROM competitors');
    res.json({ success: true, message: 'All mined keywords cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. CSV Export
app.get('/api/export/csv', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM keywords ORDER BY estimated_revenue DESC');
    let csv = 'Keyword,Kannada Keyword,Language,Seed Place,Search Volume,Keyword Difficulty,CPC ($),Est Revenue ($/mo),Competition\n';
    
    for (const r of rows) {
      csv += `"${r.keyword}","${r.keyword_kannada || ''}","${r.language}","${r.seed_place}",${r.search_volume},${r.keyword_difficulty},${r.cpc},${r.estimated_revenue},"${r.competition_level}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="karnataka_niche_keywords.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Articles API
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await db.all('SELECT * FROM articles ORDER BY created_at DESC');
    res.json({ count: articles.length, articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/articles/generate', async (req, res) => {
  try {
    const { keyword_id, apiKey } = req.body;

    if (!keyword_id) {
      return res.status(400).json({ error: 'keyword_id is required' });
    }

    const keywordRecord = await db.get('SELECT * FROM keywords WHERE id = ?', [keyword_id]);
    if (!keywordRecord) {
      return res.status(404).json({ error: 'Keyword not found' });
    }

    // 1. Fetch related image from Wikimedia/Unsplash
    const media = await fetchPlaceImage(keywordRecord.seed_place || keywordRecord.keyword);

    // 2. Generate content via Gemini (or fallback template)
    const generated = await generateArticle({
      place: keywordRecord.seed_place || keywordRecord.keyword,
      keyword: keywordRecord.keyword,
      keywordKannada: keywordRecord.keyword_kannada,
      apiKey
    });

    // 3. Save to database
    const result = await db.run(
      `INSERT INTO articles 
      (keyword_id, seed_place, title_en, title_kn, content_en, content_kn, meta_description_en, meta_description_kn, featured_image_url, featured_image_caption, humanization_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        keywordRecord.id,
        keywordRecord.seed_place,
        generated.title_en,
        generated.title_kn,
        generated.content_en,
        generated.content_kn,
        generated.meta_description_en,
        generated.meta_description_kn,
        media.imageUrl,
        media.caption,
        generated.humanization_score || 85
      ]
    );

    const article = await db.get('SELECT * FROM articles WHERE id = ?', [result.id]);
    res.json({ success: true, article });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title_en, title_kn, content_en, content_kn, meta_description_en, meta_description_kn, status } = req.body;

    await db.run(
      `UPDATE articles SET 
        title_en = COALESCE(?, title_en),
        title_kn = COALESCE(?, title_kn),
        content_en = COALESCE(?, content_en),
        content_kn = COALESCE(?, content_kn),
        meta_description_en = COALESCE(?, meta_description_en),
        meta_description_kn = COALESCE(?, meta_description_kn),
        status = COALESCE(?, status),
        published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
      WHERE id = ?`,
      [title_en, title_kn, content_en, content_kn, meta_description_en, meta_description_kn, status, status, id]
    );

    const updated = await db.get('SELECT * FROM articles WHERE id = ?', [id]);
    res.json({ success: true, article: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Live HTML Blog Post Preview & IndexNow Simulator
app.get('/api/articles/preview/:id', async (req, res) => {
  try {
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return res.status(404).send('Article not found');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title_en} | Karnataka Tourist Guide</title>
  <meta name="description" content="${article.meta_description_en}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TravelGuide",
    "name": "${article.title_en}",
    "description": "${article.meta_description_en}",
    "image": "${article.featured_image_url}",
    "author": { "@type": "Organization", "name": "Karnataka Tourist Guide" }
  }
  </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased">
  <header class="bg-amber-600 text-white p-4 shadow-md">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <h1 class="font-bold text-xl">📍 Karnataka Tourist Explorer</h1>
      <span class="bg-amber-700 text-xs px-3 py-1 rounded-full font-mono">Live Post • ${article.seed_place}</span>
    </div>
  </header>

  <main class="max-w-4xl mx-auto p-6 bg-white my-6 shadow-sm border border-slate-200 rounded-xl">
    <div class="mb-6">
      <span class="text-xs font-semibold uppercase text-amber-600 tracking-wider">Karnataka Travel Guide</span>
      <h1 class="text-3xl font-extrabold text-slate-900 mt-1 mb-2">${article.title_en}</h1>
      <h2 class="text-lg text-purple-700 font-medium mb-4">${article.title_kn}</h2>
      <div class="flex items-center gap-4 text-xs text-slate-500 border-y border-slate-100 py-2">
        <span>Published: ${new Date(article.published_at || article.created_at).toLocaleDateString()}</span>
        <span>•</span>
        <span>Humanization Score: <strong class="text-emerald-600">${article.humanization_score}%</strong></span>
        <span>•</span>
        <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Google IndexNow Pinned</span>
      </div>
    </div>

    ${article.featured_image_url ? `
    <div className="mb-6">
      <img src="${article.featured_image_url}" alt="${article.featured_image_caption}" class="w-full h-80 object-cover rounded-lg shadow-sm" />
      <p class="text-xs text-slate-500 mt-1 italic text-center">${article.featured_image_caption}</p>
    </div>` : ''}

    <article class="prose max-w-none text-slate-700 leading-relaxed space-y-4 my-6">
      <div class="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-sm rounded">
        <strong>Summary:</strong> ${article.meta_description_en}
      </div>

      <div class="markdown-body whitespace-pre-line">
        ${article.content_en}
      </div>

      <hr class="my-8 border-slate-200" />

      <div class="bg-purple-50 p-6 rounded-xl border border-purple-100">
        <h3 class="text-xl font-bold text-purple-900 mb-3">ಕನ್ನಡ ವಿವರಣೆ (Kannada Guide)</h3>
        <div class="whitespace-pre-line text-purple-950 font-sans">
          ${article.content_kn}
        </div>
      </div>
    </article>
  </main>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get('/api/articles/:id/markdown', async (req, res) => {
  try {
    const article = await db.get('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    const frontmatter = `---
title: "${article.title_en}"
title_kn: "${article.title_kn}"
place: "${article.seed_place}"
meta_description: "${article.meta_description_en}"
featured_image: "${article.featured_image_url}"
humanization_score: ${article.humanization_score}
published_at: "${article.published_at || new Date().toISOString()}"
---

![${article.featured_image_caption}](${article.featured_image_url})

# English Version
${article.content_en}

---

# ಕನ್ನಡ ಆವೃತ್ತಿ
${article.content_kn}
`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${article.seed_place.toLowerCase().replace(/\s+/g, '-')}-guide.md"`);
    res.send(frontmatter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize Obscura connection on startup if not in serverless
if (!process.env.VERCEL) {
  obscura.connect();
  app.listen(PORT, () => {
    console.log(`[Backend] Karnataka Tourist Keyword Finder Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
