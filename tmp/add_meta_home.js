const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..', 'locales');
const LANGS = ['en','ar','de','es','fr','it','ja','nl','pt','tr','zh'];

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n', 'utf8');
const setDeep = (obj, k, v) => { const P=k.split('.'); let c=obj; for(let i=0;i<P.length-1;i++){ if(typeof c[P[i]]!=='object'||!c[P[i]]) c[P[i]]={}; c=c[P[i]]; } c[P[P.length-1]]=v; };

const T = {
  'meta.home.title': {
    en:'SEO Agent — AI SEO Tracking, Keyword Research & WordPress Publishing',
    ar:'وكيل SEO — تتبع السيو بالذكاء الاصطناعي وبحث الكلمات المفتاحية والنشر على ووردبريس',
    de:'SEO Agent — KI-SEO-Tracking, Keyword-Recherche & WordPress-Publishing',
    es:'SEO Agent — Seguimiento SEO con IA, Investigación de Keywords y Publicación en WordPress',
    fr:'SEO Agent — Suivi SEO par IA, Recherche de Mots-Clés et Publication WordPress',
    it:'SEO Agent — Tracciamento SEO AI, Ricerca Keyword e Pubblicazione WordPress',
    ja:'SEO Agent — AI SEO 追跡、キーワード調査、WordPress 公開',
    nl:'SEO Agent — AI SEO-tracking, zoekwoordonderzoek en WordPress-publicatie',
    pt:'SEO Agent — Rastreamento SEO com IA, Pesquisa de Palavras-chave e Publicação WordPress',
    tr:'SEO Agent — Yapay Zeka SEO Takibi, Anahtar Kelime Araştırması ve WordPress Yayınlama',
    zh:'SEO Agent — AI SEO 追踪、关键词研究和 WordPress 发布'
  },
  'meta.home.description': {
    en:'Track keyword rankings in 200+ countries, generate AI-optimized content with GPT-5 & Claude, and publish directly to WordPress. Complete SEO platform for modern businesses.',
    ar:'تتبع تصنيفات الكلمات المفتاحية في أكثر من 200 دولة، أنشئ محتوى محسّن بالذكاء الاصطناعي مع GPT-5 و Claude، وانشر مباشرة على ووردبريس. منصة SEO متكاملة للشركات الحديثة.',
    de:'Verfolge Keyword-Rankings in über 200 Ländern, erstelle KI-optimierte Inhalte mit GPT-5 und Claude und veröffentliche direkt auf WordPress. Komplette SEO-Plattform für moderne Unternehmen.',
    es:'Rastrea rankings de keywords en más de 200 países, genera contenido optimizado con IA usando GPT-5 y Claude, y publica directamente en WordPress. Plataforma SEO completa para empresas modernas.',
    fr:'Suivez le classement de vos mots-clés dans plus de 200 pays, générez du contenu optimisé par IA avec GPT-5 et Claude, et publiez directement sur WordPress. Plateforme SEO complète pour entreprises modernes.',
    it:'Traccia il ranking delle keyword in oltre 200 paesi, genera contenuti ottimizzati con AI usando GPT-5 e Claude, e pubblica direttamente su WordPress. Piattaforma SEO completa per aziende moderne.',
    ja:'200 以上の国でキーワード順位を追跡し、GPT-5 および Claude で AI 最適化されたコンテンツを生成し、WordPress に直接公開します。現代のビジネスのための完全な SEO プラットフォーム。',
    nl:'Volg zoekwoordrankings in 200+ landen, genereer AI-geoptimaliseerde content met GPT-5 en Claude, en publiceer direct naar WordPress. Complete SEO-platform voor moderne bedrijven.',
    pt:'Rastreie classificações de palavras-chave em mais de 200 países, gere conteúdo otimizado por IA com GPT-5 e Claude, e publique diretamente no WordPress. Plataforma SEO completa para empresas modernas.',
    tr:'200\'den fazla ülkede anahtar kelime sıralamalarını takip edin, GPT-5 ve Claude ile AI için optimize edilmiş içerik oluşturun ve doğrudan WordPress\'e yayınlayın. Modern işletmeler için eksiksiz SEO platformu.',
    zh:'在 200 多个国家/地区跟踪关键词排名，使用 GPT-5 和 Claude 生成 AI 优化内容，并直接发布到 WordPress。适用于现代企业的完整 SEO 平台。'
  },
  'meta.home.keywords': {
    en:'seo tracking, keyword research, ai content generation, wordpress seo, rank tracker, gpt-5 seo, claude seo, mcp seo, google search console, bing webmaster',
    ar:'تتبع سيو, بحث كلمات مفتاحية, إنشاء محتوى بالذكاء الاصطناعي, سيو ووردبريس, متتبع الترتيب, gpt-5 seo, claude seo, mcp seo',
    de:'seo-tracking, keyword-recherche, ki-content-erstellung, wordpress seo, rank-tracker, gpt-5 seo, claude seo, mcp seo',
    es:'seguimiento seo, investigación de keywords, generación de contenido con ia, seo wordpress, rastreador de rankings, gpt-5 seo, claude seo',
    fr:'suivi seo, recherche de mots-clés, génération de contenu ia, seo wordpress, suivi de classement, gpt-5 seo, claude seo',
    it:'tracciamento seo, ricerca keyword, generazione contenuti ai, seo wordpress, rank tracker, gpt-5 seo, claude seo',
    ja:'seo 追跡, キーワード調査, ai コンテンツ生成, wordpress seo, 順位トラッカー, gpt-5 seo, claude seo',
    nl:'seo-tracking, zoekwoordonderzoek, ai-contentgeneratie, wordpress seo, rank tracker, gpt-5 seo, claude seo',
    pt:'rastreamento seo, pesquisa de palavras-chave, geração de conteúdo com ia, seo wordpress, rank tracker, gpt-5 seo, claude seo',
    tr:'seo takibi, anahtar kelime araştırması, yapay zeka içerik üretimi, wordpress seo, sıralama takipçisi, gpt-5 seo, claude seo',
    zh:'seo 追踪, 关键词研究, ai 内容生成, wordpress seo, 排名跟踪器, gpt-5 seo, claude seo'
  },
  'meta.home.ogTitle': {
    en:'SEO Agent — All-in-One AI SEO Platform',
    ar:'وكيل SEO — منصة سيو ذكاء اصطناعي متكاملة',
    de:'SEO Agent — All-in-One-KI-SEO-Plattform',
    es:'SEO Agent — Plataforma SEO con IA Todo en Uno',
    fr:'SEO Agent — Plateforme SEO IA Tout-en-Un',
    it:'SEO Agent — Piattaforma SEO AI All-in-One',
    ja:'SEO Agent — オールインワン AI SEO プラットフォーム',
    nl:'SEO Agent — Alles-in-één AI SEO-platform',
    pt:'SEO Agent — Plataforma SEO com IA Tudo em Um',
    tr:'SEO Agent — Hepsi Bir Arada AI SEO Platformu',
    zh:'SEO Agent — 一体化 AI SEO 平台'
  },
  'meta.home.ogDescription': {
    en:'Track rankings in 200+ countries, generate AI content, and publish to WordPress — all from one dashboard.',
    ar:'تتبع التصنيفات في أكثر من 200 دولة، أنشئ محتوى بالذكاء الاصطناعي، وانشر على ووردبريس — كل ذلك من لوحة تحكم واحدة.',
    de:'Rankings in über 200 Ländern verfolgen, KI-Inhalte erstellen und direkt in WordPress veröffentlichen — alles aus einem Dashboard.',
    es:'Rastrea rankings en más de 200 países, genera contenido con IA y publica en WordPress, todo desde un solo panel.',
    fr:'Suivez vos classements dans plus de 200 pays, générez du contenu IA et publiez sur WordPress, le tout depuis un seul tableau de bord.',
    it:'Traccia il ranking in oltre 200 paesi, genera contenuti AI e pubblica su WordPress, tutto da un\'unica dashboard.',
    ja:'200 以上の国で順位を追跡し、AI コンテンツを生成し、WordPress に公開 — すべて 1 つのダッシュボードから。',
    nl:'Volg rankings in 200+ landen, genereer AI-content en publiceer naar WordPress — alles vanuit één dashboard.',
    pt:'Rastreie classificações em mais de 200 países, gere conteúdo com IA e publique no WordPress — tudo a partir de um único painel.',
    tr:'200\'den fazla ülkede sıralamaları takip edin, AI içerik oluşturun ve WordPress\'e yayınlayın — hepsi tek bir kontrol panelinden.',
    zh:'在 200 多个国家/地区跟踪排名、生成 AI 内容并发布到 WordPress — 全部在一个仪表板中完成。'
  },
  'seo.home.twitterTitle': {
    en:'SEO Agent — AI-Powered SEO for Modern Businesses',
    ar:'وكيل SEO — سيو مدعوم بالذكاء الاصطناعي للشركات الحديثة',
    de:'SEO Agent — KI-gestützte SEO für moderne Unternehmen',
    es:'SEO Agent — SEO impulsado por IA para empresas modernas',
    fr:'SEO Agent — SEO propulsé par l\'IA pour entreprises modernes',
    it:'SEO Agent — SEO potenziato dall\'AI per aziende moderne',
    ja:'SEO Agent — 現代のビジネスのための AI 駆動 SEO',
    nl:'SEO Agent — AI-gestuurde SEO voor moderne bedrijven',
    pt:'SEO Agent — SEO com IA para empresas modernas',
    tr:'SEO Agent — Modern işletmeler için AI destekli SEO',
    zh:'SEO Agent — 面向现代企业的 AI 驱动 SEO'
  },
  'seo.home.twitterDescription': {
    en:'Track keywords in 200+ countries, create AI content with GPT-5 and Claude, publish to WordPress in one click.',
    ar:'تتبع الكلمات المفتاحية في أكثر من 200 دولة، أنشئ محتوى بـ GPT-5 و Claude، وانشر على ووردبريس بنقرة واحدة.',
    de:'Keywords in über 200 Ländern verfolgen, KI-Inhalte mit GPT-5 und Claude erstellen, mit einem Klick auf WordPress veröffentlichen.',
    es:'Rastrea keywords en más de 200 países, crea contenido con GPT-5 y Claude, publica en WordPress con un clic.',
    fr:'Suivez les mots-clés dans plus de 200 pays, créez du contenu avec GPT-5 et Claude, publiez sur WordPress en un clic.',
    it:'Traccia keyword in oltre 200 paesi, crea contenuti con GPT-5 e Claude, pubblica su WordPress con un clic.',
    ja:'200 以上の国でキーワードを追跡し、GPT-5 と Claude で AI コンテンツを作成し、ワンクリックで WordPress に公開します。',
    nl:'Volg zoekwoorden in 200+ landen, maak AI-content met GPT-5 en Claude, publiceer met één klik naar WordPress.',
    pt:'Rastreie palavras-chave em mais de 200 países, crie conteúdo com GPT-5 e Claude, publique no WordPress com um clique.',
    tr:'200\'den fazla ülkede anahtar kelimeleri takip edin, GPT-5 ve Claude ile AI içerik oluşturun, tek tıkla WordPress\'e yayınlayın.',
    zh:'在 200 多个国家/地区跟踪关键词，使用 GPT-5 和 Claude 创建 AI 内容，一键发布到 WordPress。'
  }
};

for (const lang of LANGS) {
  const p = path.join(base, lang, 'common.json');
  const data = readJson(p);
  for (const [k, tr] of Object.entries(T)) setDeep(data, k, tr[lang]);
  writeJson(p, data);
  console.log(`✓ ${lang}: ${Object.keys(T).length} meta.home/seo.home keys`);
}
console.log('Done.');
