const axios = require('axios');
const obscura = require('../services/obscura');

/**
 * Heuristic Keyword Difficulty and Search Volume Estimator
 */
function calculateMetrics(keyword, language = 'en') {
  const wordCount = keyword.trim().split(/\s+/).length;
  
  // Base volume heuristics based on niche tourism intent patterns
  let estimatedVolume = 1500;
  if (keyword.includes('tourist places') || keyword.includes('places to visit')) {
    estimatedVolume = 18000;
  } else if (keyword.includes('resorts') || keyword.includes('homestay') || keyword.includes('hotels')) {
    estimatedVolume = 9500;
  } else if (keyword.includes('timings') || keyword.includes('entry fee')) {
    estimatedVolume = 6200;
  } else if (keyword.includes('best time')) {
    estimatedVolume = 5400;
  } else if (wordCount >= 4) {
    estimatedVolume = 2800; // Long-tail keyword volume
  }

  // Add slight natural variance
  const volumeRandomizer = 0.8 + (Math.random() * 0.4);
  estimatedVolume = Math.round(estimatedVolume * volumeRandomizer);

  // CPC Estimator (Tourism/Hotels keywords in India range $0.15 - $0.85)
  let baseCpc = 0.25;
  if (keyword.includes('resort') || keyword.includes('booking') || keyword.includes('hotel')) {
    baseCpc = 0.75;
  } else if (keyword.includes('tourist') || keyword.includes('trip')) {
    baseCpc = 0.40;
  }
  const cpc = parseFloat((baseCpc * (0.9 + Math.random() * 0.2)).toFixed(2));

  // Keyword Difficulty Calculation (0-100)
  // Long-tail & local language (Kannada) keywords have significantly lower difficulty!
  let baseKD = 35;
  if (language === 'kn') {
    baseKD -= 15; // Kannada keywords have low online competition
  }
  if (wordCount >= 4) {
    baseKD -= 12; // Long-tail keywords easier to rank
  }
  if (keyword.includes('near me') || keyword.includes('route')) {
    baseKD -= 8;
  }

  const keywordDifficulty = Math.max(5, Math.min(85, Math.round(baseKD + (Math.random() * 10 - 5))));

  // Estimated Monthly AdSense Revenue Formula:
  // Volume * (Estimated Top 3 CTR ~15%) * CPC * AdSense Share (0.68)
  const ctr = 0.12;
  const adSenseShare = 0.68;
  const estimatedRevenue = parseFloat((estimatedVolume * ctr * cpc * adSenseShare).toFixed(2));

  let competitionLevel = 'Low';
  if (keywordDifficulty > 50) competitionLevel = 'High';
  else if (keywordDifficulty > 25) competitionLevel = 'Medium';

  return {
    search_volume: estimatedVolume,
    keyword_difficulty: keywordDifficulty,
    cpc: cpc,
    estimated_revenue: estimatedRevenue,
    competition_level: competitionLevel
  };
}

/**
 * Generate Domain Name Recommendations for Micro-Niche Sites
 */
function generateDomainRecommendations(keyword, seedPlace) {
  const sanitizedPlace = seedPlace.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedKw = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');

  const domains = [
    { domain: `${sanitizedPlace}tourism.com`, tld: '.com', estimated_price: 10 },
    { domain: `${sanitizedPlace}travelguide.in`, tld: '.in', estimated_price: 6 },
    { domain: `visit${sanitizedPlace}.org`, tld: '.org', estimated_price: 12 },
    { domain: `${sanitizedPlace}resorts.in`, tld: '.in', estimated_price: 6 },
    { domain: `explore${sanitizedPlace}.com`, tld: '.com', estimated_price: 10 }
  ];

  return domains;
}

module.exports = {
  calculateMetrics,
  generateDomainRecommendations
};
