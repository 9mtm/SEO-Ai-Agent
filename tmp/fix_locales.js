// Comprehensive locale fixer:
// 1) Add 6 bing keys to 8 missing languages
// 2) Add 2 truly-used keys (common.search, sortOptions.ctr_asc) to EN + propagate
// 3) Remove 40 unused "extra" keys from ar/tr/de/fr
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'locales');
const LANGS = ['en','ar','de','es','fr','it','ja','nl','pt','tr','zh'];

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');

const setDeep = (obj, keyPath, value) => {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
};

const deleteDeep = (obj, keyPath) => {
  const parts = keyPath.split('.');
  let cur = obj;
  const stack = [];
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]]) return;
    stack.push([cur, parts[i]]);
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
  // clean up empty parent objects
  for (let i = stack.length - 1; i >= 0; i--) {
    const [parent, key] = stack[i];
    if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0) {
      delete parent[key];
    } else break;
  }
};

// --- 1. Bing keys (missing in 8 langs) ---
const bingKeys = {
  'insight.syncingBing':       { en:'Syncing Bing data...', ar:'جاري مزامنة بيانات Bing...', es:'Sincronizando datos de Bing...', it:'Sincronizzazione dati Bing...', ja:'Bing データを同期中...', nl:'Bing-gegevens synchroniseren...', pt:'Sincronizando dados do Bing...', tr:'Bing verileri senkronize ediliyor...', zh:'正在同步 Bing 数据...' },
  'insight.bingError':         { en:'Failed to load Bing data', ar:'فشل تحميل بيانات Bing', es:'Error al cargar los datos de Bing', it:'Impossibile caricare i dati di Bing', ja:'Bing データの読み込みに失敗しました', nl:'Bing-gegevens laden mislukt', pt:'Falha ao carregar dados do Bing', tr:'Bing verileri yüklenemedi', zh:'加载 Bing 数据失败' },
  'insight.noKeywordsData':    { en:'No keyword data available yet', ar:'لا توجد بيانات كلمات مفتاحية حالياً', es:'Aún no hay datos de palabras clave disponibles', it:'Nessun dato sulle parole chiave disponibile', ja:'キーワードデータはまだありません', nl:'Nog geen zoekwoordgegevens beschikbaar', pt:'Nenhum dado de palavra-chave disponível ainda', tr:'Henüz anahtar kelime verisi yok', zh:'暂无关键词数据' },
  'insight.bingConnectTitle':  { en:'Bing Webmaster Tools Not Connected', ar:'أدوات مشرفي Bing غير متصلة', es:'Bing Webmaster Tools no conectado', it:'Bing Webmaster Tools non connesso', ja:'Bing Webmaster Tools が接続されていません', nl:'Bing Webmaster Tools niet verbonden', pt:'Bing Webmaster Tools não conectado', tr:'Bing Webmaster Tools bağlı değil', zh:'Bing 网站管理员工具未连接' },
  'insight.bingConnectDesc':   { en:'Connect your Bing Webmaster account to view search performance data including clicks, impressions, and keyword rankings.', ar:'اربط حسابك في Bing Webmaster لعرض بيانات أداء البحث بما في ذلك النقرات والظهور وتصنيفات الكلمات المفتاحية.', es:'Conecta tu cuenta de Bing Webmaster para ver datos de rendimiento de búsqueda, incluyendo clics, impresiones y clasificaciones de palabras clave.', it:'Collega il tuo account Bing Webmaster per visualizzare i dati sulle prestazioni della ricerca, inclusi clic, impressioni e classifiche delle parole chiave.', ja:'Bing Webmaster アカウントを接続して、クリック、表示回数、キーワード順位などの検索パフォーマンスデータを表示します。', nl:'Verbind je Bing Webmaster-account om zoekprestatiegegevens te bekijken, zoals klikken, vertoningen en zoekwoordrankings.', pt:'Conecte sua conta do Bing Webmaster para ver dados de desempenho da pesquisa, incluindo cliques, impressões e classificações de palavras-chave.', tr:'Tıklamalar, gösterimler ve anahtar kelime sıralamaları dahil arama performansı verilerini görüntülemek için Bing Webmaster hesabınızı bağlayın.', zh:'连接您的 Bing 网站管理员帐户以查看搜索性能数据，包括点击量、展示次数和关键词排名。' },
  'insight.bingConnectBtn':    { en:'Connect Bing Account', ar:'ربط حساب Bing', es:'Conectar cuenta de Bing', it:'Collega account Bing', ja:'Bing アカウントを接続', nl:'Bing-account verbinden', pt:'Conectar conta do Bing', tr:'Bing Hesabını Bağla', zh:'连接 Bing 帐户' },
};

// --- 2. Used "extras" that should be in EN + all langs ---
const newEnKeys = {
  'common.search':        { en:'Search', ar:'بحث', de:'Suche', es:'Buscar', fr:'Rechercher', it:'Cerca', ja:'検索', nl:'Zoeken', pt:'Buscar', tr:'Ara', zh:'搜索' },
  'sortOptions.ctr_asc':  { en:'Highest CTR', ar:'أعلى CTR', de:'Höchste CTR', es:'CTR más alto', fr:'CTR le plus élevé', it:'CTR più alto', ja:'CTR 最高', nl:'Hoogste CTR', pt:'CTR mais alto', tr:'En Yüksek CTR', zh:'最高 CTR' },
};

// --- 3. Unused extras to remove ---
const unusedExtras = [
  'auth.login.subtitle','auth.login.emailPlace','auth.login.pwdPlace','auth.login.btn','auth.login.noAcc','auth.login.register',
  'auth.register.subtitle','auth.register.namePlace','auth.register.btn','auth.register.hasAcc','auth.register.login',
  'onboarding.title','scraperSettings.description','scraperSettings.typeLabel',
  'dashboard.description','dashboard.searchPlaceholder','dashboard.addFirst',
  'dashboard.stats.totalKeywords','dashboard.stats.avgPosition','dashboard.stats.totalTraffic','dashboard.stats.topRankings',
  'domainSettings.description','domainSettings.tabs.gsc','domainSettings.tabs.danger',
  'domainSettings.general.title','domainSettings.general.nameLabel','domainSettings.general.urlLabel','domainSettings.general.saveBtn','domainSettings.general.success',
  'domainSettings.integrations.title','domainSettings.integrations.desc','domainSettings.integrations.help.title','domainSettings.integrations.help.appPassTitle',
  'seo.mcpSeo.title','seo.mcpSeo.description','seo.mcpSeo.keywords','seo.mcpSeo.ogTitle','seo.mcpSeo.ogDescription',
  'footerMenu.company','footerMenu.companyDesc',
];

// Apply changes
for (const lang of LANGS) {
  const p = path.join(base, lang, 'common.json');
  const data = readJson(p);
  let changes = 0;

  for (const [key, trans] of Object.entries(bingKeys)) {
    if (trans[lang]) { setDeep(data, key, trans[lang]); changes++; }
  }
  for (const [key, trans] of Object.entries(newEnKeys)) {
    setDeep(data, key, trans[lang]); changes++;
  }
  for (const key of unusedExtras) {
    deleteDeep(data, key);
  }

  writeJson(p, data);
  console.log(`✓ ${lang}: updated (${changes} key ops)`);
}
console.log('\nDone.');
