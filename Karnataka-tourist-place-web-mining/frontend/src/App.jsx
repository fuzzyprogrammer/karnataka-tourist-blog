import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, RefreshCw, Download, Trash2, Globe, TrendingUp, 
  DollarSign, MapPin, ExternalLink, Copy, Check, Filter, ShieldCheck,
  FileText, Sparkles, Edit3, Eye, CheckCircle2, Send
} from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('keywords'); // 'keywords' | 'articles'
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    total_keywords: 0,
    easy_difficulty: 0,
    high_revenue_count: 0,
    kannada_keywords: 0,
    total_potential_revenue: 0
  });

  const [loading, setLoading] = useState(false);
  const [mining, setMining] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [maxKd, setMaxKd] = useState(50);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedDomainModal, setSelectedDomainModal] = useState(null);
  const [selectedArticleModal, setSelectedArticleModal] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    fetchSeedPlaces();
    fetchStats();
    fetchKeywords();
    fetchArticles();
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [search, langFilter, maxKd, selectedPlace]);

  const fetchSeedPlaces = async () => {
    try {
      const res = await axios.get(`${API_BASE}/seed-places`);
      setPlaces(res.data.places || []);
    } catch (e) {
      console.error('Error fetching places:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/keywords/stats`);
      setStats(res.data);
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (langFilter) params.lang = langFilter;
      if (maxKd) params.maxKd = maxKd;
      if (selectedPlace) params.seedPlace = selectedPlace;

      const res = await axios.get(`${API_BASE}/keywords`, { params });
      setKeywords(res.data.keywords || []);
    } catch (e) {
      console.error('Error fetching keywords:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await axios.get(`${API_BASE}/articles`);
      setArticles(res.data.articles || []);
    } catch (e) {
      console.error('Error fetching articles:', e);
    }
  };

  const handleGenerateArticle = async (kw) => {
    setGeneratingId(kw.id);
    try {
      await axios.post(`${API_BASE}/articles/generate`, {
        keyword_id: kw.id,
        apiKey: geminiApiKey || undefined
      });
      await fetchArticles();
      setActiveTab('articles');
    } catch (e) {
      alert('Error generating article: ' + (e.response?.data?.error || e.message));
    } finally {
      setGeneratingId(null);
    }
  };

  const updateArticleStatus = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/articles/${id}`, { status });
      fetchArticles();
      if (selectedArticleModal && selectedArticleModal.id === id) {
        setSelectedArticleModal(prev => ({ ...prev, status }));
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const deleteArticle = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      await axios.delete(`${API_BASE}/articles/${id}`);
      fetchArticles();
      if (selectedArticleModal?.id === id) setSelectedArticleModal(null);
    }
  };

  const triggerMining = async () => {
    setMining(true);
    try {
      await axios.post(`${API_BASE}/keywords/mine`, { placeName: selectedPlace });
      setTimeout(() => {
        fetchKeywords();
        fetchStats();
        setMining(false);
      }, 3000);
    } catch (e) {
      console.error('Error starting mining:', e);
      setMining(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all mined keywords?')) {
      await axios.post(`${API_BASE}/keywords/clear`);
      fetchKeywords();
      fetchStats();
    }
  };

  const handleExportCsv = () => {
    window.open(`${API_BASE}/export/csv`, '_blank');
  };

  const copyOutline = (item) => {
    const text = `# ${item.keyword} - Niche Website Outline\n\n` +
      `Target Keyword: ${item.keyword}\n` +
      `Kannada Keyword: ${item.keyword_kannada}\n` +
      `Search Volume: ${item.search_volume}/mo\n` +
      `Est. Monthly Revenue: $${item.estimated_revenue}\n\n` +
      `## Recommended Article Structure:\n` +
      `1. Introduction to ${item.seed_place}\n` +
      `2. Top Highlights for ${item.keyword}\n` +
      `3. How to Reach & Best Time to Visit\n` +
      `4. Accommodation & Budget Tips\n` +
      `5. FAQs (${item.keyword_kannada} ಮಾರ್ಗದರ್ಶಿ)\n`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Karnataka Tourist Niche & AI Blog Suite
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Bilingual Keyword Miner & Auto Blog Post Generator (Gemini + Wikimedia + IndexNow SEO)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="password"
            placeholder="Gemini API Key (Optional)"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 w-48"
          />
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium border border-red-800/50 transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('keywords')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'keywords'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          Keyword Finder
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'articles'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Blog Articles ({articles.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'keywords' ? (
        <>
          {/* Stats Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                <span>Total Mined Keywords</span>
                <Search className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{stats.total_keywords}</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                <span>Easy Difficulty (KD ≤ 30)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{stats.easy_difficulty}</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                <span>Kannada Keywords (ಕನ್ನಡ)</span>
                <Globe className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">{stats.kannada_keywords}</div>
            </div>

            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-sm mb-2">
                <span>Est. Revenue Potential</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">${stats.total_potential_revenue}/mo</div>
            </div>
          </div>

          {/* Controls & Filter Section */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Seed Place Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Select Tourist Place (50 Places)
                </label>
                <select
                  value={selectedPlace}
                  onChange={(e) => setSelectedPlace(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Places (Mine Top 10)</option>
                  {places.map((p, idx) => (
                    <option key={idx} value={p.en}>
                      {p.en} ({p.kn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mine Button */}
              <div>
                <button
                  onClick={triggerMining}
                  disabled={mining}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm transition"
                >
                  <RefreshCw className={`w-4 h-4 ${mining ? 'animate-spin' : ''}`} />
                  {mining ? 'Mining Obscura...' : 'Start Keyword Mining'}
                </button>
              </div>

              {/* Search Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Search Keywords
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter by keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Language & KD Filters */}
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Language
                  </label>
                  <select
                    value={langFilter}
                    onChange={(e) => setLangFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">All</option>
                    <option value="en">English</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  </select>
                </div>

                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Max KD: {maxKd}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={maxKd}
                    onChange={(e) => setMaxKd(e.target.value)}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Keywords Data Table */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Keyword (En / Kn)</th>
                    <th className="px-4 py-3">Seed Place</th>
                    <th className="px-4 py-3">Volume</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">CPC ($)</th>
                    <th className="px-4 py-3">Est. AdSense</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        Loading keywords...
                      </td>
                    </tr>
                  ) : keywords.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-500">
                        No keywords mined yet. Click "Start Keyword Mining" to gather keywords using Obscura!
                      </td>
                    </tr>
                  ) : (
                    keywords.map((kw) => (
                      <tr key={kw.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-100">{kw.keyword}</div>
                          {kw.keyword_kannada && (
                            <div className="text-xs text-purple-400 mt-0.5">{kw.keyword_kannada}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-full">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            {kw.seed_place}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">
                          {kw.search_volume.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                              kw.keyword_difficulty <= 25
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : kw.keyword_difficulty <= 45
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {kw.keyword_difficulty} / 100 ({kw.competition_level})
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-400">${kw.cpc}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">
                          ${kw.estimated_revenue}/mo
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleGenerateArticle(kw)}
                              disabled={generatingId === kw.id}
                              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-xs text-white rounded font-medium transition"
                              title="Generate Blog Post"
                            >
                              <Sparkles className={`w-3 h-3 ${generatingId === kw.id ? 'animate-spin' : ''}`} />
                              {generatingId === kw.id ? 'Generating...' : 'Generate Article'}
                            </button>
                            <button
                              onClick={() => setSelectedDomainModal(kw)}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 rounded transition"
                            >
                              Domains
                            </button>
                            <button
                              onClick={() => copyOutline(kw)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded transition"
                              title="Copy Content Outline"
                            >
                              {copiedId === kw.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Blog Articles Manager View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articles.length === 0 ? (
              <div className="col-span-3 text-center py-16 bg-slate-800/30 border border-slate-800 rounded-xl text-slate-400">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-slate-300">No blog articles generated yet</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">Go to the Keyword Finder tab and click "Generate Article" on any keyword.</p>
                <button
                  onClick={() => setActiveTab('keywords')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm transition"
                >
                  Find & Select Keywords
                </button>
              </div>
            ) : (
              articles.map((art) => (
                <div key={art.id} className="bg-slate-800/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div>
                    {art.featured_image_url && (
                      <div className="h-40 overflow-hidden relative">
                        <img src={art.featured_image_url} alt={art.seed_place} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-xs px-2 py-1 rounded text-slate-300">
                          {art.seed_place}
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 font-semibold rounded-full ${
                          art.status === 'published' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          art.status === 'reviewed' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {art.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-purple-400 font-medium">
                          Humanization: {art.humanization_score}%
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-100 text-base mb-1 line-clamp-2">{art.title_en}</h3>
                      <h4 className="text-xs text-purple-300 mb-3 line-clamp-1">{art.title_kn}</h4>
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4">{art.meta_description_en}</p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedArticleModal(art)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 font-medium rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <a
                        href={`${API_BASE}/articles/preview/${art.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium rounded transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Live Post
                      </a>
                    </div>
                    {art.status !== 'published' ? (
                      <button
                        onClick={() => updateArticleStatus(art.id, 'published')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium rounded transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publish & Index
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Live & Indexed
                        </span>
                        <button
                          onClick={() => deleteArticle(art.id)}
                          className="p-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded transition"
                          title="Delete Article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Article Preview & Edit Modal */}
      {selectedArticleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs text-amber-400 font-mono">Bilingual Travel Guide</span>
                <h2 className="text-xl font-bold text-slate-100">{selectedArticleModal.title_en}</h2>
                <p className="text-sm text-purple-400">{selectedArticleModal.title_kn}</p>
              </div>
              <button
                onClick={() => setSelectedArticleModal(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {selectedArticleModal.featured_image_url && (
              <div className="mb-4">
                <img
                  src={selectedArticleModal.featured_image_url}
                  alt={selectedArticleModal.featured_image_caption}
                  className="w-full h-48 object-cover rounded-lg mb-1 border border-slate-800"
                />
                <span className="text-xs text-slate-500">{selectedArticleModal.featured_image_caption}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  English Post Content (Markdown)
                </label>
                <textarea
                  value={selectedArticleModal.content_en}
                  onChange={(e) => setSelectedArticleModal({ ...selectedArticleModal, content_en: e.target.value })}
                  className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kannada Post Content (ಕನ್ನಡ Markdown)
                </label>
                <textarea
                  value={selectedArticleModal.content_kn}
                  onChange={(e) => setSelectedArticleModal({ ...selectedArticleModal, content_kn: e.target.value })}
                  className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={selectedArticleModal.status}
                  onChange={(e) => updateArticleStatus(selectedArticleModal.id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 px-2 py-1 rounded"
                >
                  <option value="draft">Draft</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex gap-2">
                <a
                  href={`${API_BASE}/articles/preview/${selectedArticleModal.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Live Article Page
                </a>
                <button
                  onClick={() => window.open(`${API_BASE}/articles/${selectedArticleModal.id}/markdown`, '_blank')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .MD
                </button>
                <button
                  onClick={async () => {
                    await axios.put(`${API_BASE}/articles/${selectedArticleModal.id}`, selectedArticleModal);
                    fetchArticles();
                    alert('Article changes saved!');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Suggestions Modal */}
      {selectedDomainModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Recommended Domains for "{selectedDomainModal.keyword}"
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Micro niche domain name ideas ready for registration:
            </p>

            <div className="space-y-2 mb-6">
              {selectedDomainModal.domain_recommendations.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700 rounded-lg text-sm"
                >
                  <span className="font-mono text-amber-400">{d.domain}</span>
                  <span className="text-xs px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                    ~${d.estimated_price}/yr
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedDomainModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
