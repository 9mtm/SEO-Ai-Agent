import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    List, ListOrdered, Quote, Code, Code2,
    Image as ImageIcon, Youtube as YoutubeIcon, Link as LinkIcon, Link2Off,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Heading1, Heading2, Heading3, Undo, Redo,
    Minus, Highlighter, Eye, FileCode, Pilcrow
} from 'lucide-react';
import toast from 'react-hot-toast';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing your blog post...' }: RichTextEditorProps) {
    const [showSource, setShowSource] = useState(false);
    const [sourceCode, setSourceCode] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3, 4] },
            }),
            Underline,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline' } }),
            Image.configure({ inline: false, allowBase64: true, HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' } }),
            Youtube.configure({ inline: false, HTMLAttributes: { class: 'rounded-lg overflow-hidden mx-auto' } }),
            CodeBlockLowlight.configure({ lowlight }),
            Placeholder.configure({ placeholder }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] px-4 py-3',
            },
        },
    });

    // Sync external content changes (e.g. when editing a post)
    const lastExternalContent = useRef(content);
    useEffect(() => {
        if (editor && content !== lastExternalContent.current) {
            lastExternalContent.current = content;
            const currentContent = editor.getHTML();
            if (currentContent !== content) {
                editor.commands.setContent(content || '');
            }
        }
    }, [content, editor]);

    const addImage = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image too large (max 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: reader.result, filename: file.name }),
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
                    toast.success('Image inserted');
                } else {
                    toast.error(data.error || 'Upload failed');
                }
            } catch {
                toast.error('Upload failed');
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [editor]);

    const addImageUrl = useCallback(() => {
        const url = window.prompt('Image URL:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const addYoutubeVideo = useCallback(() => {
        const url = window.prompt('YouTube URL:');
        if (url && editor) {
            editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
        }
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const prev = editor.getAttributes('link').href;
        const url = window.prompt('URL:', prev || 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    }, [editor]);

    const toggleSource = useCallback(() => {
        if (!editor) return;
        if (!showSource) {
            setSourceCode(editor.getHTML());
            setShowSource(true);
        } else {
            editor.commands.setContent(sourceCode);
            onChange(sourceCode);
            setShowSource(false);
        }
    }, [editor, showSource, sourceCode, onChange]);

    if (!editor) return null;

    const ToolbarButton = ({ onClick, active, disabled, children, title }: { onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; title: string }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    const Separator = () => <div className="w-px h-6 bg-neutral-200 mx-0.5" />;

    return (
        <div className="border rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-neutral-50 border-b">
                {/* Undo / Redo */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Headings */}
                <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
                    <Pilcrow className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Text Formatting */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                    <Highlighter className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Alignment */}
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                    <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                    <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                    <AlignRight className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                    <AlignJustify className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Lists */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                    <Minus className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Code */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
                    <Code className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                    <Code2 className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Media */}
                <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Add Link">
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>
                {editor.isActive('link') && (
                    <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
                        <Link2Off className="h-4 w-4" />
                    </ToolbarButton>
                )}
                <ToolbarButton onClick={addImage} title="Upload Image">
                    <ImageIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addImageUrl} title="Image from URL">
                    <Eye className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addYoutubeVideo} title="YouTube Video">
                    <YoutubeIcon className="h-4 w-4" />
                </ToolbarButton>

                <Separator />

                {/* Source */}
                <ToolbarButton onClick={toggleSource} active={showSource} title="View/Edit HTML Source">
                    <FileCode className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor / Source */}
            {showSource ? (
                <textarea
                    value={sourceCode}
                    onChange={e => setSourceCode(e.target.value)}
                    className="w-full min-h-[300px] p-4 font-mono text-sm text-neutral-800 bg-neutral-50 focus:outline-none resize-y"
                    spellCheck={false}
                />
            ) : (
                <EditorContent editor={editor} />
            )}

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border-t text-xs text-neutral-500">
                <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters</span>
                <span>{showSource ? 'HTML Source' : 'Visual Editor'}</span>
            </div>
        </div>
    );
}
