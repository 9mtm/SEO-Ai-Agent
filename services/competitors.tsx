import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export function useRefreshCompetitors(onSuccess: Function) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (domain: string) => {
            const headers = new Headers({ 'Content-Type': 'application/json' });
            const res = await fetch(`${window.location.origin}/api/competitors/refresh`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ domain }),
            });

            if (res.status >= 400 && res.status < 600) {
                throw new Error('Bad response from server');
            }

            return res.json();
        },
        onSuccess: async () => {
            console.log('Competitors Added to Refresh Queue!!!');
            onSuccess();
            toast('Competitors Added to Refresh Queue', { icon: '🔄' });
            queryClient.invalidateQueries({ queryKey: ['keywords'] });
        },
        onError: () => {
            console.log('Error Refreshing Competitors!!!');
            toast('Error Refreshing Competitors.', { icon: '⚠️' });
        },
    });
}
