const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'locales', 'en', 'common.json');
const jaPath = path.join(__dirname, '..', 'locales', 'ja', 'common.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));

// Simple translation map for missing keys (from previous step's findings)
const manualTranslations = {
    "common.loading": "読み込み中...",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.delete": "削除",
    "common.edit": "編集",
    "common.logout": "ログアウト",
    "common.changeLanguage": "言語を変更",
    "email.visits": "訪問数",
    "email.impressions": "表示回数",
    "email.avgPosition": "平均掲載順位",
    "email.avgCtr": "平均 CTR",
    "email.improved": "上昇",
    "email.declined": "下落",
    "email.topKeywords": "上位キーワード (直近 {{days}} 日間)",
    "email.topPages": "上位ページ",
    "email.keyword": "キーワード",
    "email.page": "ページ",
    "email.clicks": "クリック数",
    "email.views": "閲覧数",
    "email.pos": "順位",
    "email.avgPos": "平均順位",
    "email.viewMore": "ダッシュボードで残り {{count}} 件のキーワードを確認",
    "email.yearsAgo": "{{count}} 年前",
    "email.monthsAgo": "{{count}} ヶ月前",
    "email.daysAgo": "{{count}} 日前",
    "email.hrsAgo": "{{count}} 時間前",
    "email.minsAgo": "{{count}} 分前",
    "email.secsAgo": "{{count}} 秒前",
    "email.subject": "[{{domain}}] キーワード順位月次アップデート",
    "email.keywordRankings": "キーワード順位",
    "email.keywordsSuffix": "キーワード",
    "email.goToDashboard": "ダッシュボードへ移動",
    "email.unsubscribeText": "メール配信を停止しますか？",
    "email.unsubscribe": "購読解除",
    "email.poweredBy": "Powered by",
    "email.position": "掲載順位",
    "email.table.best": "ベスト",
    "email.table.updated": "更新日",
    "footerMenu.product": "製品",
    "footerMenu.resources": "リソース",
    "footerMenu.legal": "法的情報",
    "footerMenu.talentManagement": "タレントマネジメント",
    "footerMenu.ats": "採用管理システム (ATS)",
    "footerMenu.documentation": "ドキュメント",
    "footerMenu.seoExpertSkill": "SEO エキスパートスキル",
    "footerMenu.blog": "ブログ",
    "footerMenu.contact": "お問い合わせ",
    "footerMenu.faq": "よくある質問",
    "footerMenu.imprint": "法的表記",
    "footerMenu.privacyPolicy": "プライバシーポリシー",
    "footerMenu.termsOfService": "利用規約",
    "footerMenu.consentPreferences": "同意設定",
    "footerMenu.accessibility": "アクセシビリティ",
    "seo.mcpSeo.twitterTitle": "SEO エージェント MCP 統合",
    "seo.mcpSeo.twitterDescription": "Claude や ChatGPT をリアルタイムの SEO データに接続します。"
};

function align(enObj, jaObj, path = '') {
    const result = {};
    for (const key in enObj) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof enObj[key] === 'object' && enObj[key] !== null && !Array.isArray(enObj[key])) {
            result[key] = align(enObj[key], jaObj[key] || {}, fullPath);
        } else {
            if (jaObj[key] !== undefined) {
                result[key] = jaObj[key];
            } else if (manualTranslations[fullPath]) {
                result[key] = manualTranslations[fullPath];
            } else {
                result[key] = enObj[key]; // Fallback to English if no translation
            }
        }
    }
    return result;
}

const alignedJa = align(en, ja);
fs.writeFileSync(jaPath, JSON.stringify(alignedJa, null, 2), 'utf8');
console.log('Japanese locale aligned with English and missing keys added.');
