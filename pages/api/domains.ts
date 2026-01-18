import type { NextApiRequest, NextApiResponse } from 'next';
import Cryptr from 'cryptr';
import db from '../../database/database';
import Domain from '../../database/models/domain';
import Keyword from '../../database/models/keyword';
import getdomainStats from '../../utils/domains';
import verifyUser from '../../utils/verifyUser';
import { checkSerchConsoleIntegration, removeLocalSCData } from '../../utils/searchConsole';

type DomainsGetRes = {
   domains: DomainType[]
   error?: string | null,
}

type DomainsAddResponse = {
   domains: DomainType[] | null,
   error?: string | null,
}

type DomainsDeleteRes = {
   domainRemoved: number,
   keywordsRemoved: number,
   SCDataRemoved: boolean,
   error?: string | null,
}

type DomainsUpdateRes = {
   domain: Domain | null,
   error?: string | null,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   await db.sync();
   const { authorized, userId, isLegacy } = verifyUser(req, res);
   if (!authorized) {
      return res.status(401).json({ error: 'Not authorized' });
   }
   if (req.method === 'GET') {
      return getDomains(req, res, userId, isLegacy);
   }
   if (req.method === 'POST') {
      return addDomain(req, res, userId, isLegacy);
   }
   if (req.method === 'DELETE') {
      return deleteDomain(req, res, userId, isLegacy);
   }
   if (req.method === 'PUT') {
      return updateDomain(req, res, userId, isLegacy);
   }
   return res.status(502).json({ error: 'Unrecognized Route.' });
}

export const getDomains = async (
   req: NextApiRequest,
   res: NextApiResponse<DomainsGetRes>,
   userId?: number,
   isLegacy?: boolean
) => {
   const withStats = !!req?.query?.withstats;
   try {
      // Multi-tenant: Filter by user_id
      const whereClause = (userId && !isLegacy) ? { user_id: userId } : {};
      const allDomains: Domain[] = await Domain.findAll({
         where: whereClause,
         order: [['added', 'ASC']]
      });

      const formattedDomains: DomainType[] = allDomains.map((el) => {
         const domainItem: DomainType = el.get({ plain: true });
         const scData = domainItem?.search_console ? JSON.parse(domainItem.search_console) : {};
         const { client_email, private_key } = scData;
         const searchConsoleData = scData ? { ...scData, client_email: client_email ? 'true' : '', private_key: private_key ? 'true' : '' } : {};

         // Ensure focus_keywords is parsed if it's a string
         let focusKeywords = domainItem.focus_keywords;
         if (typeof focusKeywords === 'string') {
            try {
               focusKeywords = JSON.parse(focusKeywords);
            } catch (e) {
               focusKeywords = undefined;
            }
         }

         return { ...domainItem, search_console: JSON.stringify(searchConsoleData), focus_keywords: focusKeywords };
      });
      const theDomains: DomainType[] = withStats ? await getdomainStats(formattedDomains) : formattedDomains;
      return res.status(200).json({ domains: theDomains });
   } catch (error) {
      console.error('[ERROR] Getting Domains:', error);
      return res.status(400).json({ domains: [], error: 'Error Getting Domains.' });
   }
};

const addDomain = async (
   req: NextApiRequest,
   res: NextApiResponse<DomainsAddResponse>,
   userId?: number,
   isLegacy?: boolean
) => {
   const { domains } = req.body;
   if (domains && Array.isArray(domains) && domains.length > 0) {

      // For multi-tenant mode, user_id is required
      if (!isLegacy && !userId) {
         return res.status(401).json({ domains: [], error: 'User authentication required' });
      }

      try {
         const domainsToAdd: any = [];
         const existingDomainsReturned: DomainType[] = [];

         // Helper to normalize domain for comparison
         const normalizeDomain = (url: string) => {
            return url.toLowerCase()
               .replace(/^https?:\/\//, '')
               .replace(/^www\./, '')
               .replace(/\/$/, '')
               .trim();
         };

         // 1. Fetch existing domains for this user to check for duplicates
         let existingDomains: Domain[] = [];
         if (userId && !isLegacy) {
            existingDomains = await Domain.findAll({ where: { user_id: userId } });
         } else {
            existingDomains = await Domain.findAll({ where: { user_id: 1 } }); // Legacy default
         }

         // Process domains sequentially to handle async operations
         for (const domainStr of domains) {
            const rawDomain = domainStr.trim();
            const normalizedInput = normalizeDomain(rawDomain);

            // Check if exists
            const exists = existingDomains.find(d => normalizeDomain(d.domain) === normalizedInput);

            if (exists) {
               console.log(`[INFO] Domain ${rawDomain} already exists as ${exists.domain}.`);

               // Detect property type from raw domain string
               let propertyType = 'domain';
               let propertyUrl = '';

               if (rawDomain.startsWith('https://') || rawDomain.startsWith('http://')) {
                  propertyType = 'url';
                  propertyUrl = rawDomain;
               } else if (rawDomain.startsWith('sc-domain:')) {
                  propertyType = 'domain';
                  propertyUrl = '';
               }

               // Parse existing search_console settings
               const existingSCSettings = exists.search_console ? JSON.parse(exists.search_console) : {};

               // Update search_console settings if property type/url is different
               const needsUpdate =
                  existingSCSettings.property_type !== propertyType ||
                  existingSCSettings.url !== propertyUrl;

               if (needsUpdate) {
                  console.log(`[INFO] Updating search_console settings for ${exists.domain}`);
                  const updatedSCSettings = {
                     ...existingSCSettings,
                     property_type: propertyType,
                     url: propertyUrl,
                  };
                  await exists.update({ search_console: JSON.stringify(updatedSCSettings) });
                  console.log(`[INFO] Successfully updated search_console settings for ${exists.domain}`);
               }

               // IMPORTANT: Update user_id if different (user is claiming ownership)
               if (userId && !isLegacy && exists.user_id !== userId) {
                  console.log(`[INFO] Updating user_id for ${exists.domain} from ${exists.user_id} to ${userId}`);
                  await exists.update({ user_id: userId });
                  console.log(`[INFO] Successfully updated user_id for ${exists.domain}`);
               }

               // Add to returned list so frontend sees it
               existingDomainsReturned.push(exists.get({ plain: true }));
               continue;
            }

            // Detect property type from raw domain string
            let propertyType = 'domain';
            let propertyUrl = '';

            if (rawDomain.startsWith('https://') || rawDomain.startsWith('http://')) {
               propertyType = 'url';
               propertyUrl = rawDomain;
            } else if (rawDomain.startsWith('sc-domain:')) {
               propertyType = 'domain';
               propertyUrl = '';
            }

            const searchConsoleSettings = {
               property_type: propertyType,
               url: propertyUrl,
               client_email: '',
               private_key: ''
            };

            const domainData: any = {
               domain: normalizedInput,
               slug: normalizedInput.replaceAll('.', '-'),
               lastUpdated: new Date().toJSON(),
               added: new Date().toJSON(),
               search_console: JSON.stringify(searchConsoleSettings),
            };

            // Add user_id for multi-tenant mode
            if (userId && !isLegacy) {
               domainData.user_id = userId;
            } else {
               // For legacy mode, default to user_id = 1
               domainData.user_id = 1;
            }

            domainsToAdd.push(domainData);
         }

         let newDomains: Domain[] = [];
         if (domainsToAdd.length > 0) {
            newDomains = await Domain.bulkCreate(domainsToAdd);
         }

         const formattedNewDomains = newDomains.map((el) => el.get({ plain: true }));
         // Combine existing (that were requested) and new
         const allProcessedDomains = [...existingDomainsReturned, ...formattedNewDomains];

         return res.status(201).json({ domains: allProcessedDomains });
      } catch (error) {
         console.log('[ERROR] Adding New Domain ', error);
         return res.status(400).json({ domains: [], error: 'Error Adding Domain.' });
      }
   } else {
      return res.status(400).json({ domains: [], error: 'Necessary data missing.' });
   }
};

export const deleteDomain = async (
   req: NextApiRequest,
   res: NextApiResponse<DomainsDeleteRes>,
   userId?: number,
   isLegacy?: boolean
) => {
   if (!req.query.domain && typeof req.query.domain !== 'string') {
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, SCDataRemoved: false, error: 'Domain is Required!' });
   }
   try {
      const { domain } = req.query || {};

      // Multi-tenant: Verify domain ownership
      const whereClause: any = { domain };
      if (userId && !isLegacy) {
         whereClause.user_id = userId;
      }

      // Check if domain exists and belongs to user
      const domainToDelete = await Domain.findOne({ where: whereClause });
      if (!domainToDelete) {
         return res.status(403).json({
            domainRemoved: 0,
            keywordsRemoved: 0,
            SCDataRemoved: false,
            error: 'Domain not found or access denied'
         });
      }

      const removedDomCount: number = await Domain.destroy({ where: whereClause });
      const removedKeywordCount: number = await Keyword.destroy({ where: { domain, ...(userId && !isLegacy ? { user_id: userId } : {}) } });
      const SCDataRemoved = await removeLocalSCData(domain as string);
      return res.status(200).json({ domainRemoved: removedDomCount, keywordsRemoved: removedKeywordCount, SCDataRemoved });
   } catch (error) {
      console.log('[ERROR] Deleting Domain: ', req.query.domain, error);
      return res.status(400).json({ domainRemoved: 0, keywordsRemoved: 0, SCDataRemoved: false, error: 'Error Deleting Domain' });
   }
};

export const updateDomain = async (
   req: NextApiRequest,
   res: NextApiResponse<DomainsUpdateRes>,
   userId?: number,
   isLegacy?: boolean
) => {
   if (!req.query.domain) {
      return res.status(400).json({ domain: null, error: 'Domain is Required!' });
   }
   const { domain } = req.query || {};
   const {
      notification_interval,
      notification_emails,
      search_console,
      business_name,
      niche,
      description,
      competitors,
      integration_settings,
      focus_keywords,
      wordpress_url,
      wordpress_username,
      wordpress_app_password,
      gsc_refresh_token,
      gsc_scope
   } = req.body;

   try {
      // Multi-tenant: Verify domain ownership
      const whereClause: any = { domain };
      if (userId && !isLegacy) {
         whereClause.user_id = userId;
      }

      const domainToUpdate: Domain | null = await Domain.findOne({ where: whereClause });

      if (!domainToUpdate) {
         return res.status(403).json({ domain: null, error: 'Domain not found or access denied' });
      }

      // Validate Search Console API Data
      if (domainToUpdate && search_console && search_console?.client_email && search_console?.private_key) {
         const theDomainObj = domainToUpdate.get({ plain: true });
         const isSearchConsoleAPIValid = await checkSerchConsoleIntegration({ ...theDomainObj, search_console: JSON.stringify(search_console) });
         if (!isSearchConsoleAPIValid.isValid) {
            return res.status(400).json({ domain: null, error: isSearchConsoleAPIValid.error });
         }
         const cryptr = new Cryptr(process.env.SECRET as string);
         search_console.client_email = search_console.client_email ? cryptr.encrypt(search_console.client_email.trim()) : '';
         search_console.private_key = search_console.private_key ? cryptr.encrypt(search_console.private_key.trim()) : '';
      }

      if (domainToUpdate) {
         const updates: any = {};
         if (notification_interval !== undefined) updates.notification_interval = notification_interval;
         if (notification_emails !== undefined) updates.notification_emails = notification_emails;
         if (search_console !== undefined) updates.search_console = JSON.stringify(search_console);
         if (business_name !== undefined) updates.business_name = business_name;
         if (niche !== undefined) updates.niche = niche;
         if (description !== undefined) updates.description = description;
         if (competitors !== undefined) {
            console.log('[DEBUG] Updating competitors:', competitors);
            updates.competitors = competitors;
         }
         if (integration_settings !== undefined) updates.integration_settings = integration_settings;
         if (focus_keywords !== undefined) updates.focus_keywords = focus_keywords;
         if (req.body.target_country !== undefined) updates.target_country = req.body.target_country;

         // Handle new encrypted WordPress fields
         if (wordpress_url !== undefined) updates.wordpress_url = wordpress_url;
         if (wordpress_username !== undefined) updates.wordpress_username = wordpress_username;
         if (wordpress_app_password !== undefined) {
            // Encrypt password before saving
            domainToUpdate.setWordPressPassword(wordpress_app_password);
         }

         // Handle new encrypted GSC fields
         if (gsc_refresh_token !== undefined) {
            // Encrypt token before saving
            domainToUpdate.setGSCRefreshToken(gsc_refresh_token);
         }
         if (gsc_scope !== undefined) updates.gsc_scope = gsc_scope;

         console.log('[DEBUG] Domain updates payload:', updates);
         domainToUpdate.set(updates);
         await domainToUpdate.save();
      }
      return res.status(200).json({ domain: domainToUpdate });
   } catch (error) {
      console.log('[ERROR] Updating Domain: ', req.query.domain, error);
      return res.status(400).json({ domain: null, error: 'Error Updating Domain. An Unknown Error Occured.' });
   }
};
