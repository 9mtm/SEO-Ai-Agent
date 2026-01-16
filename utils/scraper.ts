import axios, { AxiosResponse, CreateAxiosDefaults } from 'axios';
import * as cheerio from 'cheerio';
import HttpsProxyAgent from 'https-proxy-agent';
import countries from './countries';
import allScrapers from '../scrapers/index';
import FailedJob from '../database/models/failedJob';

type SearchResult = {
   title: string,
   url: string,
   position: number,
}

type SERPObject = {
   postion: number,
   url: string
}

export type RefreshResult = false | {
   ID: number,
   keyword: string,
   position: number,
   url: string,
   result: SearchResult[],
   error?: boolean | string
}

/**
 * Creates a SERP Scraper client promise based on the app settings.
 * @param {KeywordType} keyword - the keyword to get the SERP for.
 * @param {SettingsType} settings - the App Settings that contains the scraper details
 * @returns {Promise}
 */
export const getScraperClient = (keyword: KeywordType, settings: SettingsType, scraper?: ScraperSettings): Promise<AxiosResponse | Response> | false => {
   let apiURL = ''; let client: Promise<AxiosResponse | Response> | false = false;
   const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
      Accept: 'application/json; charset=utf8;',
   };

   // eslint-disable-next-line max-len
   const mobileAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G996U Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36';
   if (keyword && keyword.device === 'mobile') {
      headers['User-Agent'] = mobileAgent;
   }

   if (scraper) {
      // Set Scraper Header
      const scrapeHeaders = scraper.headers ? scraper.headers(keyword, settings) : null;
      const scraperAPIURL = scraper.scrapeURL ? scraper.scrapeURL(keyword, settings, countries) : null;
      if (scrapeHeaders && Object.keys(scrapeHeaders).length > 0) {
         Object.keys(scrapeHeaders).forEach((headerItemKey: string) => {
            headers[headerItemKey] = scrapeHeaders[headerItemKey as keyof object];
         });
      }
      // Set Scraper API URL
      // If not URL is generated, stop right here.
      if (scraperAPIURL) {
         apiURL = scraperAPIURL;
      } else {
         return false;
      }
   }

   if (settings && settings.scraper_type === 'proxy' && settings.proxy) {
      const axiosConfig: CreateAxiosDefaults = {};
      headers.Accept = 'gzip,deflate,compress;';
      axiosConfig.headers = headers;
      const proxies = settings.proxy.split(/\r?\n|\r|\n/g);
      let proxyURL = '';
      if (proxies.length > 1) {
         proxyURL = proxies[Math.floor(Math.random() * proxies.length)];
      } else {
         const [firstProxy] = proxies;
         proxyURL = firstProxy;
      }

      if (!proxyURL || proxyURL.trim() === '') {
         return false;
      }

      axiosConfig.httpsAgent = new (HttpsProxyAgent as any)(proxyURL.trim());
      axiosConfig.proxy = false;
      const axiosClient = axios.create(axiosConfig);
      client = axiosClient.get(`https://www.google.com/search?num=100&q=${encodeURI(keyword.keyword)}`);
   } else {
      if (!apiURL) { return false; }
      client = fetch(apiURL, { method: 'GET', headers });
   }

   return client;
};

/**
 * Scrape Google Search result as object array from the Google Search's HTML content
 * @param {string} keyword - the keyword to search for in Google.
 * @param {string} settings - the App Settings
 * @returns {RefreshResult[]}
 */
export const scrapeKeywordFromGoogle = async (keyword: KeywordType, settings: SettingsType): Promise<RefreshResult> => {
   let refreshedResults: RefreshResult = {
      ID: keyword.ID,
      keyword: keyword.keyword,
      position: keyword.position,
      url: keyword.url,
      result: keyword.lastResult,
      error: true,
   };
   const scraperType = settings?.scraper_type || '';
   const scraperObj = allScrapers.find((scraper: ScraperSettings) => scraper.id === scraperType);
   const scraperClient = getScraperClient(keyword, settings, scraperObj);

   if (!scraperClient) {
      console.log('[ERROR] Scraper Client could not be initialized. Missing URL or Settings.');
      return refreshedResults;
   }

   let scraperError: any = null;
   try {
      const res = scraperType === 'proxy' && settings.proxy ? await scraperClient : await scraperClient.then((reslt: any) => reslt.json());
      const scraperResult = scraperObj?.resultObjectKey && res[scraperObj.resultObjectKey] ? res[scraperObj.resultObjectKey] : '';
      const scrapeResult: string = (res.data || res.html || res.results || scraperResult || '');
      if (res && scrapeResult) {
         const extracted = scraperObj?.serpExtractor ? scraperObj.serpExtractor(scrapeResult) : extractScrapedResult(scrapeResult, keyword.device);
         // await writeFile('result.txt', JSON.stringify(scrapeResult), { encoding: 'utf-8' }).catch((err) => { console.log(err); });
         const serp = getSerp(keyword.domain, extracted);
         refreshedResults = { ID: keyword.ID, keyword: keyword.keyword, position: serp.postion, url: serp.url, result: extracted, error: false };
         console.log('[SERP]: ', keyword.keyword, serp.postion, serp.url);
      } else {
         const errorMsg = res.detail || res.error || 'Unknown Error';
         scraperError = errorMsg;
         // Avoid throwing [object Object]
         throw new Error(typeof res === 'object' ? JSON.stringify(res) : res);
      }
   } catch (error: any) {
      refreshedResults.error = scraperError || 'Unknown Error';
      if (settings.scraper_type === 'proxy' && error && error.response && error.response.statusText) {
         refreshedResults.error = `[${error.response.status}] ${error.response.statusText}`;
      } else if (settings.scraper_type === 'proxy' && error) {
         refreshedResults.error = error;
      }

      console.log('[ERROR] Scraping Keyword : ', keyword.keyword);
      if (!(error && error.response && error.response.statusText)) {
         // Stringify if object
         const msg = error instanceof Error ? error.message : error;
         console.log('[ERROR_MESSAGE]: ', typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg);
      } else {
         console.log('[ERROR_MESSAGE]: ', error && error.response && error.response.statusText);
      }
   }

   return refreshedResults;
};

/**
 * Extracts the Google Search result as object array from the Google Search's HTML content
 * @param {string} content - scraped google search page html data.
 * @param {string} device - The device of the keyword.
 * @returns {SearchResult[]}
 */
export const extractScrapedResult = (content: string, device: string): SearchResult[] => {
   const extractedResult: SearchResult[] = [];

   const $ = cheerio.load(content);

   // Try cleaner selectors for generic search results
   // Google often uses class 'g' for result container
   let resultContainers = $('div.g');

   // If .g not found or very few, try finding main result column
   if (resultContainers.length < 5) {
      resultContainers = $('div#search div[data-header-feature="0"]');
      if (resultContainers.length < 5) {
         // Fallback: look for generic H3 and traverse up
         resultContainers = $('h3').closest('div').parent();
      }
   }

   console.log(`Scraped entries found (DOM elements): ${resultContainers.length}`);

   let positionCounter = 0;

   resultContainers.each((i, element) => {
      try {
         const el = $(element);

         // Find title (h3)
         const titleEl = el.find('h3').first();
         const title = titleEl.text().trim();

         // Find URL (a href)
         const linkEl = el.find('a').first();
         const url = linkEl.attr('href');

         // Validate
         if (title && url && url.startsWith('http') && !url.includes('google.com/search') && !url.includes('google.com/aclk')) {
            positionCounter++;
            extractedResult.push({
               title: title,
               url: url,
               position: positionCounter
            });
         }
      } catch (e) {
         // Ignore parse error for single item
      }
   });

   // Deduplicate by URL
   const uniqueResults = extractedResult.filter((item, index, self) =>
      index === self.findIndex((t) => (
         t.url === item.url
      ))
   );

   console.log('Final extracted unique desktop results:', uniqueResults.length);

   // Mobile Scraper Fallback if 0 results
   if (uniqueResults.length === 0 && device === 'mobile') {
      const items = $('body').find('#rso > div');
      console.log('Mobile Scraper: found ', items.length, ' raw containers');
      let mobilePos = 0;
      for (let i = 0; i < items.length; i += 1) {
         const item = $(items[i]);
         const linkDom = item.find('a[role="presentation"], a');
         if (linkDom.length > 0) {
            const url = linkDom.attr('href');
            const titleDom = linkDom.find('[role="link"], h3, div[role="heading"]');
            const title = titleDom.length > 0 ? titleDom.text() : 'No Title';

            if (url && url.startsWith('http') && !url.includes('google.com')) {
               mobilePos += 1;
               extractedResult.push({ title, url, position: mobilePos });
            }
         }
      }
      return extractedResult; // No dedup for mobile generic fallback for now, or apply same dedup logic
   }

   return uniqueResults;
};

/**
 * Find in the domain's position from the extracted search result.
 * @param {string} domainURL - URL Name to look for.
 * @param {SearchResult[]} result - The search result array extracted from the Google Search result.
 * @returns {SERPObject}
 */
export const getSerp = (domainURL: string, result: SearchResult[]): SERPObject => {
   if (result.length === 0 || !domainURL) { return { postion: 0, url: '' }; }
   const URLToFind = new URL(domainURL.includes('https://') ? domainURL : `https://${domainURL}`);
   const theURL = URLToFind.hostname + URLToFind.pathname;
   const isURL = URLToFind.pathname !== '/';
   const foundItem = result.find((item) => {
      const itemURL = new URL(item.url.includes('https://') ? item.url : `https://${item.url}`);
      if (isURL && `${theURL}/` === itemURL.hostname + itemURL.pathname) {
         return true;
      }
      return URLToFind.hostname === itemURL.hostname;
   });
   return { postion: foundItem ? foundItem.position : 0, url: foundItem && foundItem.url ? foundItem.url : '' };
};

/**
 * When a Refresh request is failed, automatically add the keyword id to a failed_jobs database table
 * so that the retry cron tries to scrape it every hour until the scrape is successful.
 * @param {string} keywordID - The keywordID of the failed Keyword Scrape.
 * @returns {void}
 */
export const retryScrape = async (keywordID: number): Promise<void> => {
   if (!keywordID && !Number.isInteger(keywordID)) { return; }
   try {
      await FailedJob.findOrCreate({
         where: { payload: keywordID.toString() },
         defaults: { payload: keywordID.toString() }
      });
   } catch (error) {
      console.log('[ERROR] Failed to add to retry queue:', error);
   }
};

/**
 * When a Refresh request is completed, remove it from the failed retry queue.
 * @param {string} keywordID - The keywordID of the failed Keyword Scrape.
 * @returns {void}
 */
export const removeFromRetryQueue = async (keywordID: number): Promise<void> => {
   if (!keywordID && !Number.isInteger(keywordID)) { return; }
   try {
      await FailedJob.destroy({
         where: { payload: keywordID.toString() }
      });
   } catch (error) {
      console.log('[ERROR] Failed to remove from retry queue:', error);
   }
};
