/**
 * useWorkspaceRole
 * -----------------
 * Lightweight client hook that returns the current user's role in the active
 * workspace. Used by layout/menus to decide which settings to show.
 *
 * Permission ladder:
 *   - owner  → full access, Stripe billing
 *   - admin  → full management access (can invite, manage team, add domains,
 *              etc.) but constrained by the owner's plan limits on the server.
 *              Billing changes are still owner-only at the checkout API level.
 *   - editor → can edit existing content, cannot manage workspace-level settings
 *   - viewer → read-only
 *
 * `canManage = owner || admin` — gate UI with this for workspace settings pages.
 */
import { useEffect, useState } from 'react';

type WorkspaceRoleState = {
    loading: boolean;
    role: 'owner' | 'admin' | 'editor' | 'viewer' | null;
    isOwner: boolean;
    isAdmin: boolean;
    canManage: boolean;
    workspaceId: number | null;
};

let cache: WorkspaceRoleState | null = null;
let inflight: Promise<WorkspaceRoleState> | null = null;

function buildState(role: string | null, wsId: number | null): WorkspaceRoleState {
    const isOwner = role === 'owner';
    const isAdmin = role === 'admin';
    return {
        loading: false,
        role: (role as any) || null,
        isOwner,
        isAdmin,
        canManage: isOwner || isAdmin,
        workspaceId: wsId
    };
}

async function fetchRole(): Promise<WorkspaceRoleState> {
    if (cache) return cache;
    if (inflight) return inflight;
    inflight = fetch('/api/workspaces')
        .then((r) => r.json())
        .then((d) => {
            const current = (d?.workspaces || []).find((w: any) => w.is_current);
            const state = buildState(current?.role || null, current?.id || null);
            cache = state;
            return state;
        })
        .catch(() => {
            const state = buildState(null, null);
            // When the call fails we stay permissive so nothing is accidentally
            // hidden for the real owner during a transient network error.
            (state as any).canManage = true;
            cache = state;
            return state;
        })
        .finally(() => { inflight = null; });
    return inflight;
}

export function useWorkspaceRole(): WorkspaceRoleState {
    const [state, setState] = useState<WorkspaceRoleState>(
        cache || { loading: true, role: null, isOwner: true, isAdmin: false, canManage: true, workspaceId: null }
    );

    useEffect(() => {
        let alive = true;
        fetchRole().then((s) => { if (alive) setState(s); });
        return () => { alive = false; };
    }, []);

    return state;
}
