// Server-only: reads locale JSON files from disk.
// Import this ONLY inside getStaticProps/getServerSideProps so Next.js
// tree-shakes it out of the client bundle.
import fs from 'fs';
import path from 'path';
import { SUPPORTED_LOCALES } from './i18nHelpers';

export function loadMessages(locale: string): Record<string, any> {
  const safeLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale) ? locale : 'en';
  const file = path.join(process.cwd(), 'locales', safeLocale, 'common.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
