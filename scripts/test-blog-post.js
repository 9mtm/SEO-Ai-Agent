// Quick test: insert a blog post with en/de/fr/ar translations directly via MySQL
// Run: node scripts/test-blog-post.js

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const POST = {
    category: 'SEO',
    tags: ['test', 'ai', 'seo'],
    featured_image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1200',
    author_name: 'SEO Agent Bot',
    translations: {
        en: {
            title: 'Test Post — How AI Is Changing SEO in 2026',
            slug: 'test-how-ai-is-changing-seo-in-2026',
            excerpt: 'A short test article exploring how AI-driven SEO shifts keyword research, content strategy, and ranking signals.',
            meta_title: 'How AI Is Changing SEO in 2026',
            meta_description: 'Test post exploring AI-driven SEO in 2026 — keyword research, content, ranking signals.',
            content: `
                <h2>AI is rewriting the SEO playbook</h2>
                <p>Generative engines like ChatGPT, Gemini, and Perplexity are changing how users discover information. This is a <strong>test article</strong> created directly via the internal API to verify the blog system works end-to-end.</p>
                <h3>Three shifts to watch</h3>
                <ul>
                    <li>Intent-first keyword research</li>
                    <li>Entity- and topic-based optimization</li>
                    <li>Answer engine optimization (AEO)</li>
                </ul>
                <p>If you are reading this on the live blog, the system works end-to-end.</p>
            `.trim(),
        },
        de: {
            title: 'Testbeitrag — Wie KI SEO im Jahr 2026 verändert',
            slug: 'testbeitrag-wie-ki-seo-2026-verandert',
            excerpt: 'Ein kurzer Testartikel darüber, wie KI-gesteuerte SEO Keyword-Recherche, Content-Strategie und Ranking-Signale verändert.',
            meta_title: 'Wie KI SEO im Jahr 2026 verändert',
            meta_description: 'Testbeitrag über KI-gesteuerte SEO 2026 — Keyword-Recherche, Content, Ranking-Signale.',
            content: `
                <h2>KI schreibt die SEO-Spielregeln neu</h2>
                <p>Generative Engines wie ChatGPT, Gemini und Perplexity verändern, wie Nutzer Informationen finden. Dies ist ein <strong>Testartikel</strong>, der direkt über die interne API erstellt wurde, um zu prüfen, ob das Blog-System funktioniert.</p>
                <h3>Drei Veränderungen, die zählen</h3>
                <ul>
                    <li>Intent-First Keyword-Recherche</li>
                    <li>Entitäts- und themenbasierte Optimierung</li>
                    <li>Answer Engine Optimization (AEO)</li>
                </ul>
                <p>Wenn Sie das im Live-Blog lesen, funktioniert das System.</p>
            `.trim(),
        },
        fr: {
            title: 'Article de test — Comment l\'IA change le SEO en 2026',
            slug: 'article-test-comment-ia-change-seo-2026',
            excerpt: 'Un court article de test explorant comment le SEO piloté par l\'IA transforme la recherche de mots-clés, la stratégie de contenu et les signaux de classement.',
            meta_title: 'Comment l\'IA change le SEO en 2026',
            meta_description: 'Article de test sur le SEO piloté par l\'IA en 2026 — mots-clés, contenu, signaux.',
            content: `
                <h2>L'IA réécrit les règles du SEO</h2>
                <p>Les moteurs génératifs comme ChatGPT, Gemini et Perplexity changent la façon dont les utilisateurs trouvent l'information. Ceci est un <strong>article de test</strong> créé directement via l'API interne pour vérifier que le système de blog fonctionne.</p>
                <h3>Trois évolutions clés</h3>
                <ul>
                    <li>Recherche de mots-clés axée sur l'intention</li>
                    <li>Optimisation par entités et sujets</li>
                    <li>Answer Engine Optimization (AEO)</li>
                </ul>
                <p>Si vous lisez ceci sur le blog en direct, le système fonctionne.</p>
            `.trim(),
        },
    },
};

function wordCount(html) {
    return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const en = POST.translations.en;
        const enReading = Math.max(1, Math.round(wordCount(en.content) / 200));

        // Insert main post (uses EN as primary/shared fields)
        const [res] = await conn.execute(
            `INSERT INTO blog_posts
                (title, slug, content, excerpt, featured_image, author_name, category, tags,
                 status, published_at, meta_title, meta_description, reading_time, views_count, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', NOW(), ?, ?, ?, 0, NOW(), NOW())`,
            [
                en.title, en.slug, en.content, en.excerpt,
                POST.featured_image, POST.author_name, POST.category, JSON.stringify(POST.tags),
                en.meta_title, en.meta_description, enReading,
            ]
        );
        const postId = res.insertId;
        console.log(`✅ Created blog post #${postId} (slug: ${en.slug})`);

        // Insert translations
        for (const locale of ['en', 'de', 'fr']) {
            const t = POST.translations[locale];
            const rt = Math.max(1, Math.round(wordCount(t.content) / 200));
            await conn.execute(
                `INSERT INTO blog_post_translations
                    (blog_post_id, locale, title, slug, content, excerpt, meta_title, meta_description, reading_time, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [postId, locale, t.title, t.slug, t.content, t.excerpt, t.meta_title, t.meta_description, rt]
            );
            console.log(`   ↳ ${locale.toUpperCase()} translation added`);
        }

        console.log('\n🎉 Done. Test at:');
        console.log(`   http://localhost:55781/blog`);
        console.log(`   http://localhost:55781/blog/${en.slug}`);
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exitCode = 1;
    } finally {
        await conn.end();
    }
}

main();
