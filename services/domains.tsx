import React from 'react';
import { useRouter, NextRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type UpdatePayload = {
   domainSettings: DomainSettings,
   domain: DomainType
}

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

export async function fetchDomains(router: NextRouter, withStats: boolean): Promise<{ domains: DomainType[] }> {
   const res = await fetch(`${window.location.origin}/api/domains${withStats ? '?withstats=true' : ''}`, {
      method: 'GET',
      headers: getAuthHeaders()
   });

   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export async function fetchDomain(router: NextRouter, domainName: string): Promise<{ domain: DomainType }> {
   if (!domainName) { throw new Error('No Domain Name Provided!'); }

   const res = await fetch(`${window.location.origin}/api/domain?domain=${domainName}`, {
      method: 'GET',
      headers: getAuthHeaders()
   });
   if (res.status >= 400 && res.status < 600) {
      if (res.status === 401) {
         console.log('Unauthorized!!');
         router.push('/login');
      }
      throw new Error('Bad response from server');
   }
   return res.json();
}

export async function fetchDomainScreenshot(domain: string, forceFetch = false): Promise<string | false> {
   const domainThumbsRaw = localStorage.getItem('domainThumbs');
   const domThumbs = domainThumbsRaw ? JSON.parse(domainThumbsRaw) : {};
   if (!domThumbs[domain] || forceFetch) {
      try {
         const screenshotURL = `${window.location.origin}/api/screenshot?domain=${domain}`;
         // Screenshots are public usually, or fetched via backend proxy. 
         // If endpoint needs auth, add headers here. Usually screenshots are cached public assets or proxied.
         // Assuming this might need auth too if it's an API route.
         const domainImageRes = await fetch(screenshotURL, { headers: getAuthHeaders() });
         const domainImageBlob = domainImageRes.status === 200 ? await domainImageRes.blob() : false;
         if (domainImageBlob) {
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
               reader.onload = resolve;
               reader.onerror = reject;
               reader.readAsDataURL(domainImageBlob);
            });
            const imageBase: string = reader.result && typeof reader.result === 'string' ? reader.result : '';
            localStorage.setItem('domainThumbs', JSON.stringify({ ...domThumbs, [domain]: imageBase }));
            return imageBase;
         }
         return false;
      } catch (error) {
         return false;
      }
   } else if (domThumbs[domain]) {
      return domThumbs[domain];
   }

   return false;
}

export function useFetchDomains(router: NextRouter, withStats: boolean = false, options: any = {}) {
   return useQuery<{ domains: DomainType[] }>({ queryKey: ['domains'], queryFn: () => fetchDomains(router, withStats), ...options });
}

export function useFetchDomain(router: NextRouter, domainName: string, onSuccess: Function) {
   const result = useQuery({ queryKey: ['domain'], queryFn: () => fetchDomain(router, domainName) });

   // Handle onSuccess in useEffect instead
   React.useEffect(() => {
      if (result.data) {
         console.log('Domain Loaded!!!', result.data.domain);
         onSuccess(result.data.domain);
      }
   }, [result.data, onSuccess]);

   return result;
}

export function useAddDomain(onSuccess: Function) {
   const router = useRouter();
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async (domains: string[]) => {
         const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
         const fetchOpts = { method: 'POST', headers: getAuthHeaders(headers), body: JSON.stringify({ domains }) };
         const res = await fetch(`${window.location.origin}/api/domains`, fetchOpts);
         if (res.status >= 400 && res.status < 600) {
            const data = await res.json();
            const error = new Error(data.error || 'Bad response from server');
            (error as any).status = res.status;
            throw error;
         }
         return res.json();
      },
      onSuccess: async (data) => {
         const newDomain: DomainType[] = data.domains;
         const singleDomain = newDomain.length === 1;
         toast(`${singleDomain ? newDomain[0].domain : `${newDomain.length} domains`} Added Successfully!`, { icon: '✔️' });

         // Invalidate and refetch domains list so sidebar updates immediately
         await queryClient.invalidateQueries({ queryKey: ['domains'] });
         await queryClient.refetchQueries({ queryKey: ['domains'] });

         // Navigate to the first new domain BEFORE closing modal
         if (newDomain.length > 0) {
            router.push(`/domain/insight/${newDomain[0].slug}`);
         }

         // Close modal after navigation
         onSuccess(false);
      },
      onError: (error: any) => {
         console.log('Error Adding New Domain!!!', error);
         if (error.status === 403 || (error.message && error.message.includes('limit'))) {
            toast((t) => (
               <div className="flex flex-col gap-2 min-w-[200px]">
                  <div className="font-bold flex items-center gap-2 text-gray-900">
                     <span>👑</span> Upgrade Required
                  </div>
                  <div className="text-sm text-gray-600">{error.message}</div>
                  <button
                     className="bg-black text-white px-3 py-2 rounded-md text-xs font-medium mt-1 hover:bg-gray-800 transition-colors"
                     onClick={() => { window.location.href = '/profile/billing'; toast.dismiss(t.id); }}
                  >
                     Upgrade Plan
                  </button>
               </div>
            ), { duration: 6000, position: 'top-center' });
         } else {
            toast(error.message || 'Error Adding New Domain', { icon: '⚠️' });
         }
      },
   });
}

export function useUpdateDomain(onSuccess: Function) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: async ({ domainSettings, domain }: UpdatePayload) => {
         const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
         const fetchOpts = { method: 'PUT', headers: getAuthHeaders(headers), body: JSON.stringify(domainSettings) };
         const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, fetchOpts);
         const responseObj = await res.json();
         if (res.status >= 400 && res.status < 600) {
            throw new Error(responseObj?.error || 'Bad response from server');
         }
         return responseObj;
      },
      onSuccess: async () => {
         console.log('Settings Updated!!!');
         toast('Settings Updated!', { icon: '✔️' });
         onSuccess();
         queryClient.invalidateQueries({ queryKey: ['domains'] });
      },
      onError: (error) => {
         console.log('Error Updating Domain Settings!!!', error);
         toast('Error Updating Domain Settings', { icon: '⚠️' });
      },
   });
}

export function useDeleteDomain(onSuccess: Function) {
   const queryClient = useQueryClient();
   const router = useRouter();

   return useMutation({
      mutationFn: async (domain: DomainType) => {
         const res = await fetch(`${window.location.origin}/api/domains?domain=${domain.domain}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
         });
         if (res.status >= 400 && res.status < 600) {
            throw new Error('Bad response from server');
         }
         return res.json();
      },
      onSuccess: async () => {
         toast('Domain Removed Successfully!', { icon: '✔️' });

         // Refetch domains list
         await queryClient.refetchQueries({ queryKey: ['domains'] });

         // Get updated domains list after refetch
         const domainsData: any = queryClient.getQueryData(['domains']);
         const remainingDomains: DomainType[] = domainsData?.domains || [];

         // Navigate to first available domain or profile BEFORE closing modal
         if (remainingDomains.length > 0) {
            router.push(`/domain/insight/${remainingDomains[0].slug}`);
         } else {
            router.push('/');
         }

         // Close modal after navigation
         onSuccess();
      },
      onError: () => {
         console.log('Error Removing Domain!!!');
         toast('Error Removing Domain', { icon: '⚠️' });
      },
   });
}
