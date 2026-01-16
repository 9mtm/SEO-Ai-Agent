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

/**
 * Generate Human readable Time string.
 * @param {number} date - Keywords to scrape
 * @returns {string}
 */
const timeSince = (date: number): string => {
   const seconds = Math.floor(((new Date().getTime() / 1000) - date));
   let interval = Math.floor(seconds / 31536000);

   if (interval > 1) return `${interval} years ago`;

   interval = Math.floor(seconds / 2592000);
   if (interval > 1) return `${interval} months ago`;

   interval = Math.floor(seconds / 86400);
   if (interval >= 1) return `${interval} days ago`;

   interval = Math.floor(seconds / 3600);
   if (interval >= 1) return `${interval} hrs ago`;

   interval = Math.floor(seconds / 60);
   if (interval > 1) return `${interval} mins ago`;

   return `${Math.floor(seconds)} secs ago`;
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

/**
 * Generate the Email HTML based on given domain name and its keywords
 * @param {string} domainName - Keywords to scrape
 * @param {keywords[]} keywords - Keywords to scrape
 * @returns {Promise}
 */
const generateEmail = async (domainName: string, keywords: KeywordType[], settings: SettingsType): Promise<string> => {
   const emailTemplate = await readFile(path.join(process.cwd(), 'email', 'email.html'), { encoding: 'utf-8' });
   const currentDate = dayjs(new Date()).format('MMMM D, YYYY');
   const keywordsCount = keywords.length;
   let improved = 0; let declined = 0;

   let keywordsTable = '';

   keywords.forEach((keyword) => {
      let changeDisplay = '';
      const positionChange = getPositionChange(keyword.history, keyword.position);
      const countryFlag = `<img class="flag" src="https://flagcdn.com/w20/${keyword.country.toLowerCase()}.png" alt="${keyword.country}" title="${keyword.country}" style="vertical-align: middle; margin-right: 6px;" />`;

      if (positionChange !== 0) {
         const isImproved = positionChange > 0;
         const color = isImproved ? '#16a34a' : '#dc2626';
         const icon = isImproved ? '▲' : '▼';
         changeDisplay = `<span style="font-size: 10px; margin-left: 5px; color: ${color}; font-weight: 700; background: ${isImproved ? '#dcfce7' : '#fee2e2'}; padding: 1px 4px; border-radius: 4px;">${icon} ${Math.abs(positionChange)}</span>`;

         if (isImproved) improved += 1;
         else declined += 1;
      }

      keywordsTable += `<tr class="keyword">
                           <td style="vertical-align: middle;">${countryFlag} <span style="vertical-align: middle;">${keyword.keyword}</span></td>
                           <td style="vertical-align: middle;"><span style="font-weight:700; color: #1e293b;">${keyword.position}</span>${changeDisplay}</td>
                           <td style="vertical-align: middle; color: #64748b;">${getBestKeywordPosition(keyword.history)}</td>
                           <td style="vertical-align: middle; color: #94a3b8; font-size: 12px;">${timeSince(new Date(keyword.lastUpdated).getTime() / 1000)}</td>
                        </tr>`;
   });
   const improvedBadge = improved > 0 ? `<span class="stat-badge stat-success">▲ ${improved} Improved</span>` : '';
   const declinedBadge = declined > 0 ? `<span class="stat-badge stat-danger">▼ ${declined} Declined</span>` : '';
   const statHtml = `<div class="stat-wrapper">${improvedBadge} ${declinedBadge}</div>`;

   const isConsoleIntegrated = !!(process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL)
      || (settings.search_console_client_email && settings.search_console_private_key);

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
                  label: 'Visits', key: 'clicks', type: 'total',
                  bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', labelColor: '#7c3aed'
               },
               {
                  label: 'Impressions', key: 'impressions', type: 'total',
                  bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', labelColor: '#059669'
               },
               {
                  label: 'Avg Position', key: 'position', type: 'avg',
                  bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', labelColor: '#2563eb'
               },
               {
                  label: 'Avg CTR', key: 'ctr', type: 'avg', isPercent: true,
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

               // Color Logic regarding the background of the card
               // We keep the trend indicator logic separately
               let diffContent = '';
               let trendColor = '#64748b'; // Default gray for trend text if needed

               if (prevVal === 0) {
                  diffContent = '-';
                  trendColor = '#94a3b8';
               } else {
                  const isPositive = metric.key === 'position' ? diff < 0 : diff > 0;
                  trendColor = isPositive ? '#16a34a' : '#dc2626'; // Green or Red for the trend arrow
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
      .replace('{{stat}}', statHtml)
      .replace('{{preheader}}', `${improved} Improved, ${declined} Declined`);

   const htmlWithSCStats = await generateGoogeleConsoleStats(domainName);
   const emailHTML = updatedEmail.replace('{{SCStatsTable}}', htmlWithSCStats);

   // await writeFile('testemail.html', emailHTML, { encoding: 'utf-8' });

   return emailHTML;
};

/**
 * Generate the Email HTML for Google Search Console Data.
 * @param {string} domainName - The Domain name for which to generate the HTML.
 * @returns {Promise<string>}
 */
const generateGoogeleConsoleStats = async (domainName: string): Promise<string> => {
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
                    <h3 style="font-size: 16px; margin-bottom: 15px; color: #1E3A8A;">Top Performing Keywords (Last 7 Days)</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="keyword_table">
                        <tr align="left"><th>Keyword</th><th>Clicks</th><th>Views</th><th>Pos</th></tr>
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
                    <h3 style="font-size: 16px; margin-bottom: 15px; color: #1E3A8A;">Top Performing Pages</h3>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="keyword_table">
                        <tr align="left"><th>Page</th><th>Clicks</th><th>Views</th><th>Avg Pos</th></tr>
                        ${genTableRows(pages, 'page')}
                    </table>
                </td>
            </tr>
        </table>`;
   }

   return html;
};

export default generateEmail;
