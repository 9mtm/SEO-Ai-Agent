/* eslint-disable no-new */
const Cryptr = require('cryptr');
const { promises, createWriteStream, existsSync, mkdirSync } = require('fs');
const { readFile } = require('fs');
const path = require('path');
const { Cron } = require('croner');
require('dotenv').config({ path: './.env.local' });

// --- LOGGER SETUP ---
const logDir = path.join(process.cwd(), 'logs');
if (!existsSync(logDir)) {
   mkdirSync(logDir);
}

const accessLogStream = createWriteStream(path.join(logDir, 'cron.log'), { flags: 'a' });
const errorLogStream = createWriteStream(path.join(logDir, 'cron.error.log'), { flags: 'a' });

const originalLog = console.log;
console.log = function (...args) {
   const msg = `[${new Date().toISOString()}] [INFO] ${args.join(' ')}\n`;
   accessLogStream.write(msg);
   originalLog.apply(console, args);
};

const originalError = console.error;
console.error = function (...args) {
   const msg = `[${new Date().toISOString()}] [ERROR] ${args.join(' ')}\n`;
   errorLogStream.write(msg);
   originalError.apply(console, args);
};
// --------------------

const getAppSettings = async () => {
   const defaultSettings = {
      scraper_type: 'none',
      notification_interval: 'never',
      notification_email: '',
      smtp_server: '',
      smtp_port: '',
      smtp_username: '',
      smtp_password: '',
   };
   // console.log('process.env.SECRET: ', process.env.SECRET);
   try {
      let decryptedSettings = {};
      const exists = await promises.stat(`${process.cwd()}/data/settings.json`).then(() => true).catch(() => false);
      if (exists) {
         const settingsRaw = await promises.readFile(`${process.cwd()}/data/settings.json`, { encoding: 'utf-8' });
         const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

         try {
            const cryptr = new Cryptr(process.env.SECRET);
            const scaping_api = settings.scaping_api ? cryptr.decrypt(settings.scaping_api) : '';
            const smtp_password = settings.smtp_password ? cryptr.decrypt(settings.smtp_password) : '';
            decryptedSettings = { ...settings, scaping_api, smtp_password };
         } catch (error) {
            console.log('Error Decrypting Settings API Keys!');
         }
      } else {
         throw Error('Settings file dont exist.');
      }
      return decryptedSettings;
   } catch (error) {
      // console.log('CRON ERROR: Reading Settings File. ', error);
      await promises.writeFile(`${process.cwd()}/data/settings.json`, JSON.stringify(defaultSettings), { encoding: 'utf-8' });
      return defaultSettings;
   }
};

const generateCronTime = (interval) => {
   let cronTime = false;
   if (interval === 'hourly') {
      cronTime = '0 0 */1 * * *';
   }
   if (interval === 'daily') {
      cronTime = '0 0 0 * * *';
   }
   if (interval === 'other_day') {
      cronTime = '0 0 2-30/2 * *';
   }
   if (interval === 'daily_morning') {
      cronTime = '0 0 3 * * *';
   }
   if (interval === 'weekly') {
      cronTime = '0 0 * * 1';
   }
   if (interval === 'monthly') {
      cronTime = '0 0 1 * *'; // Run every first day of the month at 00:00(midnight)
   }

   return cronTime;
};

const runAppCronJobs = () => {
   getAppSettings().then((settings) => {
      // RUN SERP Scraping CRON (EveryDay at Midnight) 0 0 0 * *
      // Forced to run Monthly as requested
      const scrape_interval = 'monthly';
      if (scrape_interval !== 'never') {
         const scrapeCronTime = generateCronTime(scrape_interval);
         new Cron(scrapeCronTime, () => {
            // console.log('### Running Keyword Position Cron Job!');
            const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron`, fetchOpts)
               .then((res) => res.json())
               // .then((data) =>{ console.log(data)})
               .catch((err) => {
                  console.log('ERROR Making SERP Scraper Cron Request..');
                  console.log(err);
               });
         }, { scheduled: true });
      }

      // RUN Batch Email Notification CRON (Every Hour)
      // This sends a limited number of emails per run to avoid overloading SMTP server
      const batchNotifCronTime = generateCronTime('hourly');
      new Cron(batchNotifCronTime, () => {
         console.log('### Running Batch Notification Job...');
         const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
         fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/batch-notify`, fetchOpts)
            .then((res) => res.json())
            .then((data) => {
               console.log(`[BATCH NOTIFY] Sent: ${data.sent}, Failed: ${data.failed}, Remaining: ${data.remaining}`);
            })
            .catch((err) => {
               console.log('ERROR Making Batch Notification Request..');
               console.log(err);
            });
      }, { scheduled: true });
   });

   // Run Failed scraping CRON (Every Hour)
   const failedCronTime = generateCronTime('hourly');
   new Cron(failedCronTime, () => {
      // console.log('### Retrying Failed Scrapes...');

      readFile(`${process.cwd()}/data/failed_queue.json`, { encoding: 'utf-8' }, (err, data) => {
         if (data) {
            try {
               const keywordsToRetry = data ? JSON.parse(data) : [];
               if (keywordsToRetry.length > 0) {
                  const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
                  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/refresh?id=${keywordsToRetry.join(',')}`, fetchOpts)
                     .then((res) => res.json())
                     .then((refreshedData) => console.log(refreshedData))
                     .catch((fetchErr) => {
                        console.log('ERROR Making failed_queue Cron Request..');
                        console.log(fetchErr);
                     });
               }
            } catch (error) {
               console.log('ERROR Reading Failed Scrapes Queue File..', error);
            }
         } else {
            console.log('ERROR Reading Failed Scrapes Queue File..', err);
         }
      });
   }, { scheduled: true });

   // Run Google Search Console Scraper Daily
   if (process.env.SEARCH_CONSOLE_PRIVATE_KEY && process.env.SEARCH_CONSOLE_CLIENT_EMAIL) {
      const searchConsoleCRONTime = generateCronTime('daily');
      new Cron(searchConsoleCRONTime, () => {
         const fetchOpts = { method: 'POST', headers: { Authorization: `Bearer ${process.env.APIKEY}` } };
         fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/searchconsole`, fetchOpts)
            .then((res) => res.json())
            .then((data) => console.log(data))
            .catch((err) => {
               console.log('ERROR Making Google Search Console Scraper Cron Request..');
               console.log(err);
            });
      }, { scheduled: true });
   }
};

runAppCronJobs();
