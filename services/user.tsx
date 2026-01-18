import { useQuery } from '@tanstack/react-query';

// Helper for headers
const getAuthHeaders = (otherHeaders: any = { 'Content-Type': 'application/json' }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
        if (otherHeaders instanceof Headers) {
            otherHeaders.append('Authorization', `Bearer ${token}`);
            return otherHeaders;
        }
        return { ...otherHeaders, Authorization: `Bearer ${token}` };
    }
    return otherHeaders;
};

export async function fetchUser() {
    const res = await fetch(`${window.location.origin}/api/user`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        throw new Error('Failed to fetch user');
    }
    return res.json();
}

export function useFetchUser() {
    return useQuery({
        queryKey: ['user'],
        queryFn: fetchUser,
    });
}
