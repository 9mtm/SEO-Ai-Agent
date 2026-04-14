import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Trash2, Eye, Edit2, Upload, Image as ImageIcon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDialogs } from '../../components/common/AppDialog';
import toast from 'react-hot-toast';
import Dynamic from 'next/dynamic';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

const RichTextEditor = Dynamic(() => import('../../components/admin/RichTextEditor'), { ssr: false, loading: () => <div className="border rounded-lg p-8 text-center text-neutral-400">Loading editor...</div> });

const LOCALES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

const CATEGORIES = ['SEO Strategies', 'AI & Search', 'Keyword Research', 'Content Marketing', 'Technical SEO', 'Case Studies', 'Product Updates', 'Industry News'];

const emptyTranslation = () => ({ title: '', slug: '', content: '', excerpt: '', meta_title: '', meta_description: '' });

export default function AdminBlog() {
    const { confirmDialog, Dialogs } = useAppDialogs();
    const [posts, setPosts] = useState<any[]>([]);
    const [editing, setEditing] = useState<any>(null);
    const [activeLocale, setActiveLocale] = useState('en');
    const [uploading, setUploading] = useState(false);

    // Shared fields
    const [shared, setShared] = useState({ category: '', status: 'draft', featured_image: '' });

    // Per-locale fields: { en: { title, slug, content, ... }, de: { ... }, fr: { ... } }
    const [translations, setTranslations] = useState<Record<string, any>>({ en: emptyTranslation() });

    const currentT = translations[activeLocale] || emptyTranslation();

    const updateTranslation = (field: string, value: string) => {
        setTranslations(prev => ({
            ...prev,
            [activeLocale]: { ...(prev[activeLocale] || emptyTranslation()), [field]: value },
        }));
    };

    const hasTranslation = (locale: string) => {
        const t = translations[locale];
        return t && t.title && t.content;
    };

    const uploadImage = async (file: File) => {
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result, filename: file.name }),
                });
                const data = await res.json();
                if (res.ok && data.url) { setShared(s => ({ ...s, featured_image: data.url })); toast.success('Image uploaded'); }
                else toast.error(data.error || 'Upload failed');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch { toast.error('Upload failed'); setUploading(false); }
    };

    const load = () => { fetch('/api/admin/blog').then(r => r.json()).then(d => { if (d.posts) setPosts(d.posts); }); };
    useEffect(() => { load(); }, []);

    const save = async () => {
        if (!currentT.title || !currentT.content) { toast.error('Title and content required for current language'); return; }

        if (editing) {
            // Save each locale that has content
            for (const locale of Object.keys(translations)) {
                const t = translations[locale];
                if (!t.title || !t.content) continue;
                await fetch('/api/admin/blog', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editing.id, locale,
                        title: t.title, slug: t.slug, content: t.content, excerpt: t.excerpt,
                        meta_title: t.meta_title, meta_description: t.meta_description,
                        category: shared.category, status: shared.status, featured_image: shared.featured_image,
                    }),
                });
            }
            toast.success('Updated');
        } else {
            // Create new post with current locale
            const res = await fetch('/api/admin/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locale: activeLocale,
                    title: currentT.title, slug: currentT.slug, content: currentT.content, excerpt: currentT.excerpt,
                    meta_title: currentT.meta_title, meta_description: currentT.meta_description,
                    category: shared.category, status: shared.status, featured_image: shared.featured_image,
                }),
            });
            const data = await res.json();

            // If other locales have content, save them too
            if (data.post?.id) {
                for (const locale of Object.keys(translations)) {
                    if (locale === activeLocale) continue;
                    const t = translations[locale];
                    if (!t.title || !t.content) continue;
                    await fetch('/api/admin/blog', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: data.post.id, locale, title: t.title, slug: t.slug, content: t.content, excerpt: t.excerpt, meta_title: t.meta_title, meta_description: t.meta_description }),
                    });
                }
            }
            toast.success('Created');
        }

        resetForm();
        load();
    };

    const resetForm = () => {
        setEditing(null);
        setActiveLocale('en');
        setShared({ category: '', status: 'draft', featured_image: '' });
        setTranslations({ en: emptyTranslation() });
    };

    const remove = async (id: number) => {
        const ok = await confirmDialog({ title: 'Delete this post?', description: 'All translations will be deleted too. This cannot be undone.', confirmText: 'Delete', variant: 'danger' });
        if (!ok) return;
        await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
        toast.success('Deleted');
        load();
    };

    const startEdit = (p: any) => {
        setEditing(p);
        setShared({ category: p.category || '', status: p.status, featured_image: p.featured_image || '' });

        // Load translations
        const trans: Record<string, any> = {};
        if (p.translations && p.translations.length > 0) {
            for (const t of p.translations) {
                trans[t.locale] = {
                    title: t.title, slug: t.slug, content: t.content || '',
                    excerpt: t.excerpt || '', meta_title: t.meta_title || '', meta_description: t.meta_description || '',
                };
            }
        }
        // Fallback: if no translations, use main post as 'en'
        if (Object.keys(trans).length === 0) {
            trans.en = { title: p.title, slug: p.slug, content: p.content || '', excerpt: p.excerpt || '', meta_title: p.meta_title || '', meta_description: p.meta_description || '' };
        }
        setTranslations(trans);
        setActiveLocale(Object.keys(trans)[0] || 'en');
    };

    const getPostTranslationLocales = (p: any) => {
        if (!p.translations || p.translations.length === 0) return ['en'];
        return p.translations.map((t: any) => t.locale);
    };

    return (
        <AdminLayout title="Blog Posts">
            <Dialogs />
            <h1 className="text-2xl font-bold mb-6">Blog Posts ({posts.length})</h1>

            {/* Editor */}
            <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">{editing ? 'Edit Post' : 'New Post'}</h2>
                    {editing && <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>}
                </div>

                {/* Shared: Category + Status + Image */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select value={shared.category} onChange={e => setShared({ ...shared, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">Select Category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={shared.status} onChange={e => setShared({ ...shared, status: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <div />
                </div>

                {/* Featured Image */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        {shared.featured_image ? (
                            <div className="relative w-32 h-20 rounded-lg overflow-hidden border flex-shrink-0">
                                <img src={shared.featured_image} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setShared({ ...shared, featured_image: '' })} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                            </div>
                        ) : (
                            <div className="w-32 h-20 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0"><ImageIcon className="h-8 w-8 text-neutral-300" /></div>
                        )}
                        <div className="flex-1">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800">
                                <Upload className="h-4 w-4" />{uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
                            </label>
                            <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WebP, SVG — max 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Language Tabs */}
                <div className="border-b border-neutral-200">
                    <div className="flex items-center gap-1">
                        {LOCALES.map(l => (
                            <button key={l.code} onClick={() => {
                                if (!translations[l.code]) setTranslations(prev => ({ ...prev, [l.code]: emptyTranslation() }));
                                setActiveLocale(l.code);
                            }} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeLocale === l.code ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                                {hasTranslation(l.code) && <span className="w-2 h-2 rounded-full bg-green-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Per-locale fields */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input placeholder={`Title (${activeLocale.toUpperCase()})`} value={currentT.title} onChange={e => updateTranslation('title', e.target.value)} />
                        <Input placeholder="Slug (auto-generated)" value={currentT.slug} onChange={e => updateTranslation('slug', e.target.value)} />
                    </div>
                    <RichTextEditor content={currentT.content} onChange={(html) => updateTranslation('content', html)} placeholder={`Write content in ${LOCALES.find(l => l.code === activeLocale)?.label || activeLocale}...`} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input placeholder={`Meta Title (${activeLocale.toUpperCase()} — max 70)`} value={currentT.meta_title} onChange={e => updateTranslation('meta_title', e.target.value)} maxLength={70} />
                        <Input placeholder={`Meta Description (${activeLocale.toUpperCase()} — max 160)`} value={currentT.meta_description} onChange={e => updateTranslation('meta_description', e.target.value)} maxLength={160} />
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={save}><Plus className="h-4 w-4 mr-1" /> {editing ? 'Update All Languages' : 'Create'}</Button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Title</th>
                            <th className="px-4 py-3 text-center">Languages</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Views</th>
                            <th className="px-4 py-3 text-left">Published</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {posts.map(p => (
                            <tr key={p.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3">
                                    <div className="font-semibold">{p.title}</div>
                                    <div className="text-xs text-neutral-500">/{p.slug} • {p.reading_time} min read</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {getPostTranslationLocales(p).map((locale: string) => {
                                            const l = LOCALES.find(x => x.code === locale);
                                            return <span key={locale} className="text-sm" title={l?.label || locale}>{l?.flag || locale}</span>;
                                        })}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                                </td>
                                <td className="px-4 py-3 text-center">{p.views_count}</td>
                                <td className="px-4 py-3 text-xs text-neutral-500">{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" className="p-1 hover:bg-neutral-100 rounded"><Eye className="h-4 w-4 text-neutral-500" /></a>}
                                        <button onClick={() => startEdit(p)} className="p-1 hover:bg-neutral-100 rounded"><Edit2 className="h-4 w-4 text-blue-600" /></button>
                                        <button onClick={() => remove(p.id)} className="p-1 hover:bg-neutral-100 rounded"><Trash2 className="h-4 w-4 text-red-600" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {posts.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500">No blog posts yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
