/**
 * WorkspaceIndicator
 * -------------------
 * Compact dropdown shown in the dashboard header that displays the current
 * active workspace and lets the user switch between their memberships.
 * Mirrors the switcher inside AccountMenu but is always visible at the top
 * of the page — like Slack / Linear / Notion.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

type WorkspaceItem = {
    id: number;
    name: string;
    slug: string;
    role: string;
    is_personal: boolean;
    is_current: boolean;
};

export default function WorkspaceIndicator() {
    const [open, setOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [switching, setSwitching] = useState<number | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClickOut = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClickOut);
        return () => document.removeEventListener('mousedown', onClickOut);
    }, []);

    useEffect(() => {
        fetch('/api/workspaces')
            .then((r) => r.json())
            .then((d) => { if (d?.workspaces) setWorkspaces(d.workspaces); })
            .catch(() => { });
    }, []);

    const current = workspaces.find((w) => w.is_current);

    const switchTo = async (id: number) => {
        setSwitching(id);
        try {
            const res = await fetch('/api/workspaces/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspace_id: id })
            });
            if (res.ok) {
                toast.success('Workspace switched');
                window.location.reload();
            } else {
                toast.error('Failed');
            }
        } finally {
            setSwitching(null);
        }
    };

    if (workspaces.length === 0) return null;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-neutral-100 border border-neutral-200 transition-colors"
                title={current?.name || 'Workspace'}
            >
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-semibold text-neutral-900 max-w-[160px] truncate hidden sm:inline">
                    {current?.name || 'Workspace'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                    <div className="px-4 pt-1 pb-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Switch workspace
                    </div>
                    <div className="max-h-72 overflow-y-auto px-2 space-y-0.5">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => !ws.is_current && switchTo(ws.id)}
                                disabled={ws.is_current || switching === ws.id}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors ${ws.is_current
                                    ? 'bg-blue-50 text-blue-700 cursor-default'
                                    : 'text-neutral-700 hover:bg-neutral-100 cursor-pointer'
                                    }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${ws.is_current ? 'bg-blue-100' : 'bg-neutral-100'}`}>
                                        <Building2 className={`h-3.5 w-3.5 ${ws.is_current ? 'text-blue-600' : 'text-neutral-500'}`} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="truncate font-medium leading-tight">{ws.name}</span>
                                        <span className="text-[10px] text-neutral-400 uppercase tracking-wide leading-tight mt-0.5">
                                            {ws.role}{ws.is_personal ? ' • personal' : ''}
                                        </span>
                                    </div>
                                </div>
                                {ws.is_current && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                    <div className="px-2 pt-2 mt-1 border-t border-neutral-100">
                        <Link
                            href="/profile/workspaces"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-md bg-blue-50 border border-dashed border-blue-300 flex items-center justify-center flex-shrink-0">
                                <Plus className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span>Manage workspaces</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
