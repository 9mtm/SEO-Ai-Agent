/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs';
import { readFile } from 'fs/promises';
import path from 'path';
import { getKeywordsInsight, getPagesInsight } from './insight';
import { readLocalSCData } from './searchConsole';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
// Use live domain for images so they appear in emails even when sent from localhost
const imageBaseUrl = 'https://seo-agent.net';

const seoAiAgentLogo = 'https://cdn.flowxtra.net/landingpage/logo_assest/dpro_logo.png';

type SCStatsObject = {
   [key: string]: {
      html: string,
      label: string,
      clicks?: number,
      impressions?: number
   },
}

// Helper to load translations
const loadTranslations = async (locale: string) => {
   try {
      const filePath = path.join(process.cwd(), 'locales', locale, 'common.json');
      const fileContent = await readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
   } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      if (locale !== 'en') {
         // Fallback to english
         try {
            const enPath = path.join(process.cwd(), 'locales', 'en', 'common.json');
            return JSON.parse(await readFile(enPath, 'utf-8'));
         } catch (e) { return {}; }
      }
      return {};
   }
};

// Helper for translation lookup
const getTranslation = (translations: any, keyPath: string, variables: Record<string, any> = {}) => {
   const keysArray = keyPath.split('.');
   let value = translations;
   for (const k of keysArray) {
      value = value?.[k];
   }
   if (typeof value !== 'string') return keyPath;

   Object.keys(variables).forEach(varName => {
      value = value.replace(new RegExp(`{{${varName}}}`, 'g'), String(variables[varName]));
   });
   return value;
};

/**
 * Returns a Keyword's position change value by comparing the current position with previous position.
 * @param {KeywordHistory} history - Keywords to scrape
 * @param {number} position - Keywords to scrape
 * @returns {number}
 */
const getPositionChange = (history: KeywordHistory, position: number): number => {
   let status = 0;
   if (Object.keys(history).length >= 2) {
      const historyArray = Object.keys(history).map((dateKey) => ({
         date: new Date(dateKey).getTime(),
         dateRaw: dateKey,
         position: history[dateKey],
      }));
      const historySorted = historyArray.sort((a, b) => a.date - b.date);
      const previousPos = historySorted[historySorted.length - 2].position;
      status = previousPos === 0 ? position : previousPos - position;
      if (position === 0 && previousPos > 0) {
         status = previousPos - 100;
      }
   }
   return status;
};

const getBestKeywordPosition = (history: KeywordHistory) => {
   let bestPos;
   if (Object.keys(history).length > 0) {
      const historyArray = Object.keys(history).map((itemID) => ({ date: itemID, position: history[itemID] }))
         .sort((a, b) => a.position - b.position).filter((el) => (el.position > 0));
      if (historyArray[0]) {
         bestPos = { ...historyArray[0] };
      }
   }

   return bestPos?.position || '-';
};

import jwt from 'jsonwebtoken';

/**
 * Generate the Email HTML based on given domain name and its keywords
 * @param {string} domainName - Keywords to scrape
 * @param {keywords[]} keywords - Keywords to scrape
 * @returns {Promise}
 */
const generateEmail = async (domainName: string, keywords: KeywordType[], settings: SettingsType, locale: string = 'en', userId: number | null = null): Promise<string> => {
   const translations = await loadTranslations(locale);
   const t = (key: string, vars: any = {}) => getTranslation(translations, key, vars);

   const emailTemplate = await readFile(path.join(process.cwd(), 'email', 'email.html'), { encoding: 'utf-8' });

   // Generate Unsubscribe Link
   let unsubscribeUrl = 'https://seo-agent.net/login'; // Fallback
   if (userId) {
      const secret = process.env.SECRET;
      if (secret) {
         // Create a token that doesn't expire quickly (e.g., 30 days or never)
         // Since it's for unsubscribe, valid for a long time is usually UX friendly.
         // Let's say 90 days.
         const token = jwt.sign({ userId }, secret, { expiresIn: '90d' });
         const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seo-agent.net';
         unsubscribeUrl = `${appUrl}/unsubscribe?token=${token}`;
      }
   }

   // We might need localized date format later, for now keeping English format for date
   const currentDate = dayjs(new Date()).format('MMMM D, YYYY');
   const keywordsCount = keywords.length;
   let improved = 0; let declined = 0;

   // 1. Calculate Stats for ALL keywords
   keywords.forEach((keyword) => {
      const positionChange = getPositionChange(keyword.history, keyword.position);
      if (positionChange !== 0) {
         if (positionChange > 0) improved++;
         else declined++;
      }
   });

   // 2. Sort and Generate HTML for Top 10
   // Prioritize ranked keywords (position > 0), then sort by position (ascending/best first)
   const sortedKeywords = [...keywords].sort((a, b) => {
      const posA = a.position > 0 ? a.position : 999999;
      const posB = b.position > 0 ? b.position : 999999;
      return posA - posB;
   });

   const displayedKeywords = sortedKeywords.slice(0, 10);
   let keywordsTable = '';

   displayedKeywords.forEach((keyword) => {
      let changeDisplay = '';
      const positionChange = getPositionChange(keyword.history, keyword.position);
      const countryFlag = `<img class="flag" src="https://flagcdn.com/w20/${keyword.country.toLowerCase()}.png" alt="${keyword.country}" title="${keyword.country}" style="vertical-align: middle; margin-right: 6px;" />`;

      if (positionChange !== 0) {
         const isImproved = positionChange > 0;
         const color = isImproved ? '#16a34a' : '#dc2626';
         const icon = isImproved ? '▲' : '▼';
         changeDisplay = `<span style="font-size: 10px; margin-left: 5px; color: ${color}; font-weight: 700; background: ${isImproved ? '#dcfce7' : '#fee2e2'}; padding: 1px 4px; border-radius: 4px;">${icon} ${Math.abs(positionChange)}</span>`;
      }

      // Time since translation logic inline
      const secondsC = (new Date().getTime() / 1000) - (new Date(keyword.lastUpdated).getTime() / 1000);
      let timeString = '';
      if (secondsC < 60) timeString = t('email.secsAgo', { count: Math.floor(secondsC) });
      else if (secondsC < 3600) timeString = t('email.minsAgo', { count: Math.floor(secondsC / 60) });
      else if (secondsC < 86400) timeString = t('email.hrsAgo', { count: Math.floor(secondsC / 3600) });
      else if (secondsC < 2592000) timeString = t('email.daysAgo', { count: Math.floor(secondsC / 86400) });
      else if (secondsC < 31536000) timeString = t('email.monthsAgo', { count: Math.floor(secondsC / 2592000) });
      else timeString = t('email.yearsAgo', { count: Math.floor(secondsC / 31536000) });


      keywordsTable += `<tr class="keyword">
                           <td style="vertical-align: middle;">${countryFlag} <span style="vertical-align: middle;">${keyword.keyword}</span></td>
                           <td style="vertical-align: middle;"><span style="font-weight:700; color: #1e293b;">${keyword.position}</span>${changeDisplay}</td>
                           <td style="vertical-align: middle; color: #64748b;">${getBestKeywordPosition(keyword.history)}</td>
                           <td style="vertical-align: middle; color: #94a3b8; font-size: 12px;">${timeString}</td>
                        </tr>`;
   });

   if (keywords.length > 10) {
      keywordsTable += `<tr>
          <td colspan="4" style="text-align: center; padding: 12px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
             <a href="https://seo-agent.net/domain/tracking/${domainName}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">${t('email.viewMore', { count: keywords.length - 10 })} →</a>
          </td>
       </tr>`;
   }

   const improvedBadge = improved > 0 ? `<span class="stat-badge stat-success">▲ ${improved} ${t('email.improved')}</span>` : '';
   const declinedBadge = declined > 0 ? `<span class="stat-badge stat-danger">▼ ${declined} ${t('email.declined')}</span>` : '';
   const statHtml = `<div class="stat-wrapper">${improvedBadge} ${declinedBadge}</div>`;

   let trafficSummaryHTML = '';
   // Always try to read local data if available
   if (true) {
      try {
         console.log('Generating Email for', domainName);
         const localSCData = await readLocalSCData(domainName);
         if (localSCData && localSCData.stats && localSCData.stats.length > 0) {
            console.log('Found Local SC Data, items:', localSCData.stats.length);
            // Clone and reverse to get Newest First
            const stats = [...localSCData.stats].reverse();
            const currentPeriod = stats.slice(0, 30);
            const previousPeriod = stats.slice(30, 60);

            const calcTotal = (arr: any[], key: string) => arr.reduce((sum, item) => sum + (item[key] || 0), 0);
            const calcAvg = (arr: any[], key: string) => arr.length ? arr.reduce((sum, item) => sum + (item[key] || 0), 0) / arr.length : 0;

            const metrics = [
               {
                  label: t('email.visits'), key: 'clicks', type: 'total',
                  bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', labelColor: '#7c3aed'
               },
               {
                  label: t('email.impressions'), key: 'impressions', type: 'total',
                  bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', labelColor: '#059669'
               },
               {
                  label: t('email.avgPosition'), key: 'position', type: 'avg',
                  bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', labelColor: '#2563eb'
               },
               {
                  label: t('email.avgCtr'), key: 'ctr', type: 'avg', isPercent: true,
                  bg: '#fffbeb', border: '#fde68a', text: '#92400e', labelColor: '#d97706'
               }
            ];

            let cardsHTML = '';

            metrics.forEach((metric) => {
               const currentVal = metric.type === 'total' ? calcTotal(currentPeriod, metric.key) : calcAvg(currentPeriod, metric.key);
               const prevVal = metric.type === 'total' ? calcTotal(previousPeriod, metric.key) : calcAvg(previousPeriod, metric.key);

               let diff = 0;
               if (prevVal > 0) {
                  diff = ((currentVal - prevVal) / prevVal) * 100;
               }

               // Color Logic
               let trendColor = '#64748b';
               let diffContent = '';

               if (prevVal === 0) {
                  diffContent = '-';
                  trendColor = '#94a3b8';
               } else {
                  const isPositive = metric.key === 'position' ? diff < 0 : diff > 0;
                  trendColor = isPositive ? '#16a34a' : '#dc2626';
                  const arrow = diff === 0 ? '' : (diff > 0 ? '▲' : '▼');
                  diffContent = `${arrow} ${Math.abs(diff).toFixed(1)}%`;
               }

               let displayVal = '';
               if (metric.isPercent) displayVal = `${(currentVal * 1).toFixed(2)}%`;
               else if (metric.key === 'position') displayVal = Math.round(currentVal).toString();
               else displayVal = Math.round(currentVal).toLocaleString();

               cardsHTML += `
                    <td class="traffic-card" width="23%" valign="top" style="padding: 15px; background: ${metric.bg}; border: 1px solid ${metric.border}; border-radius: 10px; text-align: center;">
                        <span class="traffic-label" style="display:block; margin-bottom:6px; font-size:11px; color:${metric.labelColor}; font-weight:700; text-transform:uppercase;">${metric.label}</span>
                        <span class="traffic-number" style="font-size: 20px; display:block; margin-bottom:4px; font-weight:800; color:${metric.text};">${displayVal}</span>
                        <span style="font-size: 11px; font-weight: 700; color: ${trendColor};">
                           ${diffContent}
                        </span>
                    </td>
                    <td width="2%">&nbsp;</td>
                `;
            });

            trafficSummaryHTML = `
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="traffic-summary" style="width:100%; border-spacing: 0;">
                    <tr>
                        ${cardsHTML}
                    </tr>
                </table>`;
         }
      } catch (err) {
         console.error('Error generating traffic summary:', err);
      }
   }

   const updatedEmail = emailTemplate
      .replace('{{logo}}', `<img class="logo_img" src="${seoAiAgentLogo}" alt="SEO Ai Agent" width="24" height="24" />`)
      .replace('{{currentDate}}', currentDate)
      .replace('{{domainName}}', domainName)
      .replace('{{keywordsCount}}', keywordsCount.toString())
      .replace('{{keywordsTable}}', keywordsTable)
      .replace('{{TrafficSummary}}', trafficSummaryHTML)
      .replace('{{appURL}}', process.env.NEXT_PUBLIC_APP_URL || '')
      .replace('{{dashboardUrl}}', 'https://seo-agent.net?utm_source=email_report&utm_medium=email&utm_campaign=daily_rankings')
      .replace('{{unsubscribeUrl}}', unsubscribeUrl)
      .replace('{{stat}}', statHtml)
      .replace('{{preheader}}', `${improved} ${t('email.improved')}, ${declined} ${t('email.declined')}`);

   const htmlWithSCStats = await generateGoogeleConsoleStats(domainName, t);
   const emailHTML = updatedEmail.replace('{{SCStatsTable}}', htmlWithSCStats);

   return emailHTML;
};

/**
 * Generate the Email HTML for Google Search Console Data.
 * @param {string} domainName - The Domain name for which to generate the HTML.
 * @returns {Promise<string>}
 */
const generateGoogeleConsoleStats = async (domainName: string, t: any): Promise<string> => {
   if (!domainName) return '';

   const localSCData = await readLocalSCData(domainName);
   if (!localSCData || !localSCData.stats || !localSCData.stats.length) {
      return '';
   }

   const keywords = getKeywordsInsight(localSCData, 'clicks', 'sevenDays');
   const pages = getPagesInsight(localSCData, 'clicks', 'sevenDays');

   const genTableRows = (items: any[], type: 'keyword' | 'page') => {
      return items.slice(0, 5).reduce((acc, item) => {
         // For pages, shorten the URL to show only path
         let col1 = type === 'keyword' ? item.keyword : item.page;
         if (type === 'page') {
            try {
               const urlObj = new URL(col1);
               col1 = urlObj.pathname === '/' ? '/' : urlObj.pathname;
            } catch (e) { /* keep original on error */ }
         }

         return acc + `<tr>
                <td class="keyword-text" style="font-weight: 500; word-break: break-word;">${col1}</td>
                <td>${item.clicks}</td>
                <td>${item.impressions}</td>
                <td>${Math.round(item.position)}</td>
            </tr>`;
      }, '');
   };

   let html = '';

   // Top Keywords Table
   if (keywords.length > 0) {
      html += `
        <table role="presentation" class="main" style="margin-top: 20px;">
            <tr>
                <td class="wrapper">
                    <h3 style="font-size: 16px; margin-bottom: 15px; color: #1E3A8A;">${t('email.topKeywords', { days: 7 })}</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="keyword_table">
                        <tr align="left"><th>${t('email.keyword')}</th><th>${t('email.clicks')}</th><th>${t('email.views')}</th><th>${t('email.pos')}</th></tr>
                        ${genTableRows(keywords, 'keyword')}
                    </table>
                </td>
            </tr>
        </table>`;
   }

   // Top Pages Table
   if (pages.length > 0) {
      html += `
        <table role="presentation" class="main" style="margin-top: 20px;">
            <tr>
                <td class="wrapper">
                    <h3 style="font-size: 16px; margin-bottom: 15px; color: #1E3A8A;">${t('email.topPages')}</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="keyword_table">
                        <tr align="left"><th>${t('email.page')}</th><th>${t('email.clicks')}</th><th>${t('email.views')}</th><th>${t('email.avgPos')}</th></tr>
                        ${genTableRows(pages, 'page')}
                    </table>
                </td>
            </tr>
        </table>`;
   }

   return html;
};

export default generateEmail;
