const axios = require('axios');

/**
 * Generate SEO optimized blog post in English and Kannada using Gemini API (or zero-cost fallback)
 */
async function generateArticle({ place, keyword, keywordKannada, apiKey }) {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY;

  const systemPrompt = `You are a veteran travel journalist and native Karnataka local who has spent 15+ years exploring every district of Karnataka.
Your task is to write an EXTREMELY COMPREHENSIVE, insanely valuable, highly humanized, SEO-optimized travel guide for "${place}" focusing on the keyword "${keyword}" (Kannada: "${keywordKannada || ''}").

WHY THIS MATTERS (EEAT & Unique Value):
Do NOT write generic surface-level AI summaries. Users can get generic summaries anywhere. You must provide REAL local value:
1. Exact realistic transport options (KSRTC bus timings, private taxi costs in INR, nearest rail station).
2. Honest pros and cons (crowd levels, best photography angles, hidden spots most tourists miss).
3. Local Food Guide (must-try authentic regional dishes e.g. Coorg Pandi Curry, Mangalore Neer Dosa, Mysore Masala Dosa, North Karnataka Jolada Rotti meal).
4. FAQ section answering top 5 long-tail questions visitors ask Google about "${keyword}".
5. Human Tone: Natural, conversational, storytelling style, personal recommendation tone (95%+ humanization). Avoid cliché AI words like "delve", "nestled", "tapestry", "beacon", "testament".

STRUCTURE REQUIRED IN MARKDOWN:
- H2: Ultimate Travel Guide to ${place} (${keyword})
- H2: Quick Facts & Overview (Entry Fee, Timings, Best Season)
- H2: Top Things to Do & Hidden Local Secrets
- H2: Detailed Itinerary & Best Spots
- H2: Authentic Local Karnataka Food Options Nearby
- H2: How to Reach ${place} (Budget Bus vs Train vs Driving)
- H2: Frequently Asked Questions (FAQs) for ${keyword}

Return ONLY valid JSON matching this schema:
{
  "title_en": "High CTR SEO Title containing keyword",
  "title_kn": "Attractive Kannada Title",
  "meta_description_en": "150-160 character high-click meta description with call to action",
  "meta_description_kn": "Kannada meta description",
  "content_en": "Extremely detailed 800-1200+ word markdown article in English...",
  "content_kn": "Detailed 600-800+ word markdown article in Kannada...",
  "humanization_score": 96
}`;

  if (geminiKey) {
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    for (const model of models) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nKeyword: ${keyword}\nPlace: ${place}\nKannada Keyword: ${keywordKannada || ''}` }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7
            }
          },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const textOutput = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          return JSON.parse(textOutput);
        }
      } catch (err) {
        console.warn(`Gemini API call with ${model} failed:`, err.response?.data?.error?.message || err.message);
      }
    }
  }

  // Zero-cost Fallback Template Generator if API Key is not set
  return {
    title_en: `${place} Travel Guide: Complete Tips & Places to Visit for ${keyword}`,
    title_kn: `${place} ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ: ${keywordKannada || place} ನೋಡಬೇಕಾದ ಸ್ಥಳಗಳು`,
    meta_description_en: `Discover everything you need to know about ${place} targeting ${keyword}. Plan your itinerary, entry fees, and timing.`,
    meta_description_kn: `${place} ಕುರಿತು ಸಂಪೂರ್ಣ ಮಾಹಿತಿ, ಭೇಟಿ ನೀಡಲು ಸೂಕ್ತ ಸಮಯ ಮತ್ತು ತಲುಪುವ ಮಾರ್ಗ.`,
    content_en: `## Introduction to ${place}\n\n${place} is one of Karnataka's premier tourist attractions, drawing thousands of visitors each year. If you are searching for **${keyword}**, this comprehensive guide provides all the practical details you need.\n\n### Best Time to Visit\n- **Peak Season:** October to March\n- **Monsoon:** July to September (lush green views)\n\n### Top Things to Do\n1. Sightseeing near key landmarks around ${place}\n2. Local Karnataka cuisine sampling\n3. Photography and heritage exploration\n\n### How to Reach ${place}\n- **By Bus:** Regular KSRTC buses from major cities.\n- **By Train:** Nearest station connects to major hubs.\n\n--- *Generated with High Humanization Score (Fallback Mode)*`,
    content_kn: `## ${place} ಪ್ರವಾಸದ ಪರಿಚಯ\n\nಕರ್ನಾಟಕದ ಅತ್ಯಂತ ಪ್ರಸಿದ್ಧ ಪ್ರವಾಸಿ ತಾಣಗಳಲ್ಲಿ ${place} ಒಂದಾಗಿದೆ. ನೀವು **${keywordKannada || keyword}** ಕುರಿತು ಮಾಹಿತಿ ಹುಡುಕುತ್ತಿದ್ದರೆ, ಈ ಮಾರ್ಗದರ್ಶಿ ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.\n\n### ಭೇಟಿ ನೀಡಲು ಸೂಕ್ತ ಸಮಯ\n- **ಅಕ್ಟೋಬರ್ မှ ಮಾರ್ಚ್:** ಹವಾಮಾನ ಆಹ್ಲಾದಕರವಾಗಿರುತ್ತದೆ.\n\n### ಮುಖ್ಯ ಆಕರ್ಷಣೆಗಳು\n1. ಸ್ಥಳೀಯ ವೀಕ್ಷಣೆ ಸ್ಥಳಗಳು\n2. ಸಾಂಪ್ರದಾಯಿಕ ಆಹಾರ ಸಂಸ್ಕೃತಿ\n\n--- *ಕನ್ನಡ ವಿವರಣೆ (ಫಾಲ್ಬ್ಯಾಕ್ ಮೂಡ್)*`,
    humanization_score: 88
  };
}

module.exports = { generateArticle };
