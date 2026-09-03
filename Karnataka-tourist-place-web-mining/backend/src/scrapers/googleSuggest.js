const axios = require('axios');

/**
 * Fetch Google Autocomplete suggestions for a keyword
 * @param {string} query 
 * @param {string} lang ('en' or 'kn')
 */
async function getGoogleSuggestions(query, lang = 'en') {
  try {
    const response = await axios.get('http://suggestqueries.google.com/complete/search', {
      params: {
        client: 'chrome',
        hl: lang,
        q: query
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (Array.isArray(response.data) && response.data[1]) {
      return response.data[1]; // Array of suggested search strings
    }
    return [];
  } catch (error) {
    console.error(`[GoogleSuggest] Error fetching for ${query}:`, error.message);
    return [];
  }
}

/**
 * Generate seed modifiers to mine long-tail tourist keywords
 */
async function expandTouristKeywords(placeName, placeKannada) {
  const englishModifiers = [
    '',
    'tourist places',
    'best time to visit',
    'resorts',
    'homestay',
    'itinerary',
    'budget trip',
    'entry fee timings',
    'distance from bangalore',
    'places to visit near'
  ];

  const kannadaModifiers = [
    '',
    'ಪ್ರವಾಸಿ ಸ್ಥಳಗಳು',
    'ನೋಡಬೇಕಾದ ಸ್ಥಳಗಳು',
    'ರೆಸಾರ್ಟ್ಸ್',
    'ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ'
  ];

  const results = [];

  // Expand English keywords
  for (const mod of englishModifiers) {
    const query = mod ? `${placeName} ${mod}` : placeName;
    const suggestions = await getGoogleSuggestions(query, 'en');
    results.push(...suggestions.map(s => ({ keyword: s, language: 'en', seed_place: placeName })));
  }

  // Expand Kannada keywords
  if (placeKannada) {
    for (const mod of kannadaModifiers) {
      const query = mod ? `${placeKannada} ${mod}` : placeKannada;
      const suggestions = await getGoogleSuggestions(query, 'kn');
      results.push(...suggestions.map(s => ({ keyword: s, language: 'kn', seed_place: placeName })));
    }
  }

  // Remove duplicates
  const uniqueMap = new Map();
  for (const item of results) {
    if (!uniqueMap.has(item.keyword)) {
      uniqueMap.set(item.keyword, item);
    }
  }

  return Array.from(uniqueMap.values());
}

module.exports = {
  getGoogleSuggestions,
  expandTouristKeywords
};
