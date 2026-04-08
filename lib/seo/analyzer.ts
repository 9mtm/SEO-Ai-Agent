/**
 * Professional SEO Content Analyzer
 * ----------------------------------
 * Scores an article (title + meta + content + focus keywords) on a 0-100
 * scale using the same 20+ checks that Yoast / Rank Math apply.
 *
 * Returns a structured report with:
 *   - overall score 0-100
 *   - grade: 'poor' | 'ok' | 'good' | 'excellent'
 *   - checks[]: each with pass/warn/fail, message, impact
 *
 * Designed so it can run both server-side (in MCP tools) and client-side
 * (in the editor) because it depends only on `cheerio` which is already in
 * the project, plus pure string operations.
 */

import * as cheerio from 'cheerio';

export interface SeoAnalysisInput {
    title: string;
    meta_description?: string;
    content: string; // HTML
    focus_keywords?: string[];
    slug?: string;
    url?: string;
    language?: string;
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheck {
    id: string;
    label: string;
    status: CheckStatus;
    message: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
}

export interface SeoReport {
    score: number;            // 0-100
    grade: 'poor' | 'ok' | 'good' | 'excellent';
    stats: {
        word_count: number;
        reading_time_min: number;
        paragraph_count: number;
        heading_count: { h1: number; h2: number; h3: number; h4: number };
        link_count: { internal: number; external: number };
        image_count: number;
        images_missing_alt: number;
        keyword_density: Record<string, number>; // keyword -> %
    };
    checks: SeoCheck[];
}

const IMPACT_WEIGHTS: Record<SeoCheck['impact'], number> = {
    critical: 10,
    high: 6,
    medium: 4,
    low: 2
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stripTags = (html: string) => {
    try {
        return cheerio.load(html).text().replace(/\s+/g, ' ').trim();
    } catch {
        return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
};

const countWords = (txt: string) => (txt ? txt.split(/\s+/).filter(Boolean).length : 0);

const lc = (s: string) => (s || '').toLowerCase();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function analyzeSEO(input: SeoAnalysisInput): SeoReport {
    const title = input.title || '';
    const meta = input.meta_description || '';
    const html = input.content || '';
    const keywords = (input.focus_keywords || []).filter(Boolean).map(lc);
    const primary = keywords[0] || '';
    const slug = input.slug || '';

    const $ = cheerio.load(html);
    const plainText = $.root().text().replace(/\s+/g, ' ').trim();
    const wordCount = countWords(plainText);
    const paragraphCount = $('p').length;
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const h4Count = $('h4').length;
    const images = $('img');
    const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')).length;

    let internalLinks = 0;
    let externalLinks = 0;
    $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (/^https?:\/\//i.test(href)) externalLinks++;
        else if (href.startsWith('/') || href.startsWith('#')) internalLinks++;
    });

    // Keyword density
    const density: Record<string, number> = {};
    keywords.forEach((kw) => {
        if (!kw) return;
        const rx = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = plainText.match(rx) || [];
        density[kw] = wordCount ? Math.round((matches.length / wordCount) * 10000) / 100 : 0;
    });

    const checks: SeoCheck[] = [];
    const add = (c: SeoCheck) => checks.push(c);

    // -------- Title checks --------
    const titleLen = title.length;
    if (!title.trim()) {
        add({ id: 'title_exists', label: 'Title', status: 'fail', message: 'Title is missing.', impact: 'critical' });
    } else if (titleLen < 30) {
        add({ id: 'title_length', label: 'Title length', status: 'warn', message: `Title is too short (${titleLen} chars). Aim for 50–60.`, impact: 'high' });
    } else if (titleLen > 65) {
        add({ id: 'title_length', label: 'Title length', status: 'warn', message: `Title is too long (${titleLen} chars). Keep it under 60.`, impact: 'high' });
    } else {
        add({ id: 'title_length', label: 'Title length', status: 'pass', message: `Title length is optimal (${titleLen} chars).`, impact: 'high' });
    }

    if (primary) {
        if (lc(title).includes(primary)) {
            add({ id: 'title_keyword', label: 'Focus keyword in title', status: 'pass', message: `Primary keyword "${primary}" appears in title.`, impact: 'critical' });
        } else {
            add({ id: 'title_keyword', label: 'Focus keyword in title', status: 'fail', message: `Primary keyword "${primary}" is missing from the title.`, impact: 'critical' });
        }
        // Keyword near beginning
        const idx = lc(title).indexOf(primary);
        if (idx !== -1 && idx < Math.max(30, title.length / 2)) {
            add({ id: 'title_keyword_position', label: 'Keyword position in title', status: 'pass', message: 'Focus keyword is near the beginning of the title.', impact: 'medium' });
        } else if (idx !== -1) {
            add({ id: 'title_keyword_position', label: 'Keyword position in title', status: 'warn', message: 'Move focus keyword closer to the start of the title.', impact: 'medium' });
        }
    }

    // -------- Meta description --------
    const metaLen = meta.length;
    if (!meta.trim()) {
        add({ id: 'meta_exists', label: 'Meta description', status: 'fail', message: 'Meta description is missing.', impact: 'high' });
    } else if (metaLen < 120) {
        add({ id: 'meta_length', label: 'Meta description length', status: 'warn', message: `Too short (${metaLen} chars). Aim for 140–160.`, impact: 'medium' });
    } else if (metaLen > 160) {
        add({ id: 'meta_length', label: 'Meta description length', status: 'warn', message: `Too long (${metaLen} chars). Keep under 160.`, impact: 'medium' });
    } else {
        add({ id: 'meta_length', label: 'Meta description length', status: 'pass', message: `Meta length is optimal (${metaLen} chars).`, impact: 'medium' });
    }

    if (primary && meta && lc(meta).includes(primary)) {
        add({ id: 'meta_keyword', label: 'Focus keyword in meta', status: 'pass', message: 'Primary keyword is in the meta description.', impact: 'high' });
    } else if (primary && meta) {
        add({ id: 'meta_keyword', label: 'Focus keyword in meta', status: 'warn', message: 'Include the primary keyword in the meta description.', impact: 'high' });
    }

    // -------- Content length --------
    if (wordCount < 300) {
        add({ id: 'content_length', label: 'Content length', status: 'fail', message: `Only ${wordCount} words. Aim for at least 600.`, impact: 'critical' });
    } else if (wordCount < 600) {
        add({ id: 'content_length', label: 'Content length', status: 'warn', message: `${wordCount} words. Aim for 1,000+ for deeper content.`, impact: 'high' });
    } else if (wordCount < 1000) {
        add({ id: 'content_length', label: 'Content length', status: 'pass', message: `Good length (${wordCount} words).`, impact: 'high' });
    } else {
        add({ id: 'content_length', label: 'Content length', status: 'pass', message: `Excellent length (${wordCount} words).`, impact: 'high' });
    }

    // -------- Headings --------
    if (h1Count > 1) {
        add({ id: 'h1_unique', label: 'Single H1', status: 'warn', message: `Found ${h1Count} H1 tags — use only one.`, impact: 'medium' });
    }
    if (h2Count === 0 && wordCount > 400) {
        add({ id: 'headings', label: 'Subheadings', status: 'warn', message: 'No H2 headings. Break content into sections.', impact: 'medium' });
    } else if (h2Count > 0) {
        add({ id: 'headings', label: 'Subheadings', status: 'pass', message: `${h2Count} H2 headings found.`, impact: 'medium' });
    }
    if (primary) {
        const headingsText = $('h1,h2,h3').text();
        if (lc(headingsText).includes(primary)) {
            add({ id: 'keyword_in_heading', label: 'Keyword in subheading', status: 'pass', message: 'Primary keyword appears in a heading.', impact: 'medium' });
        } else {
            add({ id: 'keyword_in_heading', label: 'Keyword in subheading', status: 'warn', message: 'Use the primary keyword in at least one subheading.', impact: 'medium' });
        }
    }

    // -------- Keyword density (primary) --------
    if (primary) {
        const dp = density[primary] || 0;
        if (dp === 0) {
            add({ id: 'keyword_in_body', label: 'Keyword in body', status: 'fail', message: `Primary keyword "${primary}" is not used in the content.`, impact: 'critical' });
        } else if (dp < 0.5) {
            add({ id: 'keyword_density', label: 'Keyword density', status: 'warn', message: `Density is low (${dp}%). Target 0.5%–2.5%.`, impact: 'high' });
        } else if (dp > 3) {
            add({ id: 'keyword_density', label: 'Keyword density', status: 'warn', message: `Density is too high (${dp}%). Risk of keyword stuffing.`, impact: 'high' });
        } else {
            add({ id: 'keyword_density', label: 'Keyword density', status: 'pass', message: `Density is optimal (${dp}%).`, impact: 'high' });
        }

        // First 10% of content should mention keyword
        const firstChunk = lc(plainText.slice(0, Math.max(200, plainText.length * 0.1)));
        if (firstChunk.includes(primary)) {
            add({ id: 'keyword_early', label: 'Keyword in intro', status: 'pass', message: 'Primary keyword appears in the intro.', impact: 'medium' });
        } else {
            add({ id: 'keyword_early', label: 'Keyword in intro', status: 'warn', message: 'Mention the primary keyword in the first paragraph.', impact: 'medium' });
        }
    }

    // -------- Images --------
    if (images.length === 0 && wordCount > 500) {
        add({ id: 'images', label: 'Images', status: 'warn', message: 'Add at least one image to enrich the content.', impact: 'medium' });
    } else if (imagesMissingAlt > 0) {
        add({ id: 'image_alt', label: 'Image alt text', status: 'warn', message: `${imagesMissingAlt} image(s) missing alt attribute.`, impact: 'medium' });
    } else if (images.length > 0) {
        add({ id: 'image_alt', label: 'Image alt text', status: 'pass', message: 'All images have alt text.', impact: 'medium' });
    }

    // -------- Links --------
    if (externalLinks === 0 && wordCount > 500) {
        add({ id: 'external_links', label: 'External links', status: 'warn', message: 'Add references to authoritative external sources.', impact: 'low' });
    } else if (externalLinks > 0) {
        add({ id: 'external_links', label: 'External links', status: 'pass', message: `${externalLinks} external link(s) found.`, impact: 'low' });
    }
    if (internalLinks === 0 && wordCount > 500) {
        add({ id: 'internal_links', label: 'Internal links', status: 'warn', message: 'Link to related articles on your own site.', impact: 'medium' });
    } else if (internalLinks > 0) {
        add({ id: 'internal_links', label: 'Internal links', status: 'pass', message: `${internalLinks} internal link(s) found.`, impact: 'medium' });
    }

    // -------- URL slug --------
    if (primary && slug) {
        const slugLc = lc(slug).replace(/[-_]/g, ' ');
        if (slugLc.includes(primary)) {
            add({ id: 'slug_keyword', label: 'Keyword in URL', status: 'pass', message: 'URL slug contains the primary keyword.', impact: 'high' });
        } else {
            add({ id: 'slug_keyword', label: 'Keyword in URL', status: 'warn', message: 'Include the primary keyword in the URL slug.', impact: 'high' });
        }
        if (slug.length > 75) {
            add({ id: 'slug_length', label: 'URL length', status: 'warn', message: 'URL slug is too long. Keep it concise.', impact: 'low' });
        }
    }

    // -------- Readability (very rough) --------
    const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentence = sentences.length ? wordCount / sentences.length : 0;
    if (avgSentence > 25) {
        add({ id: 'readability', label: 'Readability', status: 'warn', message: `Sentences average ${Math.round(avgSentence)} words — consider shortening them.`, impact: 'medium' });
    } else if (sentences.length > 0) {
        add({ id: 'readability', label: 'Readability', status: 'pass', message: `Good sentence length (avg ${Math.round(avgSentence)} words).`, impact: 'medium' });
    }

    // -------- Scoring --------
    // Each failed/warned check subtracts its impact weight from 100.
    let score = 100;
    for (const c of checks) {
        if (c.status === 'fail') score -= IMPACT_WEIGHTS[c.impact];
        else if (c.status === 'warn') score -= Math.ceil(IMPACT_WEIGHTS[c.impact] / 2);
    }
    score = Math.max(0, Math.min(100, score));

    const grade: SeoReport['grade'] =
        score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'ok' : 'poor';

    return {
        score,
        grade,
        stats: {
            word_count: wordCount,
            reading_time_min: Math.max(1, Math.round(wordCount / 200)),
            paragraph_count: paragraphCount,
            heading_count: { h1: h1Count, h2: h2Count, h3: h3Count, h4: h4Count },
            link_count: { internal: internalLinks, external: externalLinks },
            image_count: images.length,
            images_missing_alt: imagesMissingAlt,
            keyword_density: density
        },
        checks
    };
}
