import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Plus, Trash2, Eye, Edit2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppDialogs } from '../../components/common/AppDialog';
import toast from 'react-hot-toast';
import Dynamic from 'next/dynamic';
export { getServerSideProps } from '../../utils/requireSuperAdmin';

const RichTextEditor = Dynamic(() => import('../../components/admin/RichTextEditor'), { ssr: false, loading: () => <div className="border rounded-lg p-8 text-center text-neutral-400">Loading editor...</div> });

export default function AdminBlog() {
    const { confirmDialog, Dialogs } = useAppDialogs();
    const [posts, setPosts] = useState<any[]>([]);
    const [editing, setEditing] = useState<any>(null);
    const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', category: '', status: 'draft', meta_title: '', meta_description: '', featured_image: '' });
    const [uploading, setUploading] = useState(false);

    const CATEGORIES = ['SEO Strategies', 'AI & Search', 'Keyword Research', 'Content Marketing', 'Technical SEO', 'Case Studies', 'Product Updates', 'Industry News'];

    const uploadImage = async (file: File) => {
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result, filename: file.name })
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    setForm(f => ({ ...f, featured_image: data.url }));
                    toast.success('Image uploaded');
                } else {
                    toast.error(data.error || 'Upload failed');
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch {
            toast.error('Upload failed');
            setUploading(false);
        }
    };

    const load = () => { fetch('/api/admin/blog').then(r => r.json()).then(d => { if (d.posts) setPosts(d.posts); }); };
    useEffect(() => { load(); }, []);

    const save = async () => {
        if (!form.title || !form.content) { toast.error('Title and content required'); return; }
        const method = editing ? 'PATCH' : 'POST';
        const body = editing ? { id: editing.id, ...form } : form;
        const res = await fetch('/api/admin/blog', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) { toast.success(editing ? 'Updated' : 'Created'); setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', category: '', status: 'draft', meta_title: '', meta_description: '', featured_image: '' }); load(); }
        else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    };

    const remove = async (id: number) => {
        const ok = await confirmDialog({ title: 'Delete this post?', description: 'This cannot be undone.', confirmText: 'Delete', variant: 'danger' });
        if (!ok) return;
        await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
        toast.success('Deleted');
        load();
    };

    const startEdit = (p: any) => {
        setEditing(p);
        setForm({ title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt || '', category: p.category || '', status: p.status, meta_title: p.meta_title || '', meta_description: p.meta_description || '', featured_image: p.featured_image || '' });
    };

    return (
        <AdminLayout title="Blog Posts">
            <Dialogs />
            <h1 className="text-2xl font-bold mb-6">Blog Posts ({posts.length})</h1>

            {/* Editor */}
            <div className="bg-white rounded-xl border p-6 mb-6 space-y-3">
                <h2 className="font-semibold text-lg">{editing ? 'Edit Post' : 'New Post'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <Input placeholder="Slug (auto-generated)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                </div>
                <RichTextEditor content={form.content} onChange={(html) => setForm(f => ({ ...f, content: html }))} placeholder="Start writing your blog post..." />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">Select Category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="border rounded-lg px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <div />
                </div>

                {/* Featured Image Upload */}
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        {form.featured_image ? (
                            <div className="relative w-32 h-20 rounded-lg overflow-hidden border flex-shrink-0">
                                <img src={form.featured_image} alt="Preview" className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setForm({ ...form, featured_image: '' })} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                            </div>
                        ) : (
                            <div className="w-32 h-20 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="h-8 w-8 text-neutral-300" />
                            </div>
                        )}
                        <div className="flex-1">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800">
                                <Upload className="h-4 w-4" />
                                {uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
                            </label>
                            <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WebP, SVG — max 5MB</p>
                            {form.featured_image && <p className="text-xs text-green-600 mt-0.5 truncate">{form.featured_image}</p>}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Meta Title (SEO — max 70 chars)" value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} maxLength={70} />
                    <Input placeholder="Meta Description (SEO — max 160 chars)" value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} maxLength={160} />
                </div>
                <div className="flex gap-2">
                    <Button onClick={save}><Plus className="h-4 w-4 mr-1" /> {editing ? 'Update' : 'Create'}</Button>
                    {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', category: '', status: 'draft', meta_title: '', meta_description: '', featured_image: '' }); }}>Cancel</Button>}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                            <th className="px-4 py-3 text-left">Title</th>
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
                        {posts.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500">No blog posts yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
