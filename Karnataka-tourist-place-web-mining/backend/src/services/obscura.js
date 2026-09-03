const puppeteer = require('puppeteer-core');
const axios = require('axios');

class ObscuraService {
  constructor() {
    this.endpoint = process.env.OBSCURA_ENDPOINT || 'ws://127.0.0.1:9222';
    this.browser = null;
  }

  async connect() {
    try {
      this.browser = await puppeteer.connect({
        browserWSEndpoint: `${this.endpoint}/devtools/browser`,
      });
      console.log('[Obscura] Connected successfully to CDP endpoint');
      return true;
    } catch (err) {
      console.warn('[Obscura] Local Obscura instance not detected, using fallback http mode.', err.message);
      return false;
    }
  }

  async scrapeUrl(url) {
    if (this.browser) {
      const page = await this.browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();
        const content = await page.content();
        await page.close();
        return { title, content };
      } catch (e) {
        await page.close();
        throw e;
      }
    } else {
      // Fallback simple HTTP request
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      return { title: '', content: response.data };
    }
  }
}

module.exports = new ObscuraService();
