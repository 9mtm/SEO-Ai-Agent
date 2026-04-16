import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { User, Mail, Loader2, Camera, AlertTriangle, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFetchDomains } from '../../services/domains';
import { useLanguage } from '../../context/LanguageContext';

const ProfilePage: NextPage = () => {
   const router = useRouter();
   const { t, locale, setLocale } = useLanguage();

   // Fallback to 'en' if locale is undefined for some reason
   const currentLocale = locale || 'en';

   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteConfirmation, setDeleteConfirmation] = useState('');
   const { data: domainsData } = useFetchDomains(router);

   // User State
   const [user, setUser] = useState({
      name: '',
      email: '',
      picture: '',
      role: 'user'
   });

   const [formData, setFormData] = useState({
      name: '',
      email: ''
   });

   const getAuthHeaders = () => {
      const headers: any = { 'Content-Type': 'application/json' };
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
   };

   // Fetch User Data
   useEffect(() => {
      const fetchUser = async () => {
         try {
            const response = await fetch('/api/user', {
               headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.success && data.user) {
               setUser(data.user);
               setFormData({
                  name: data.user.name || '',
                  email: data.user.email || ''
               });
            }
         } catch (error) {
            console.error('Failed to fetch user:', error);
            toast.error('Failed to load profile data');
         } finally {
            setIsLoading(false);
         }
      };

      fetchUser();
   }, []);
   // ...
   const handleUpdateProfile = async () => {
      setIsSaving(true);
      // Simulate API call
      try {
         await new Promise(resolve => setTimeout(resolve, 1000));

         setUser(prev => ({ ...prev, ...formData }));
         toast.success(t('profile.success'));
      } catch (error) {
         toast.error(t('profile.error'));
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteAccount = async () => {
      if (deleteConfirmation !== 'DELETE') return;

      setIsDeleting(true);
      try {
         const response = await fetch('/api/user', {
            method: 'DELETE',
            headers: getAuthHeaders()
         });
         const data = await response.json();

         if (data.success) {
            toast.success(t('profile.deleteSuccess'));
            // Redirect to login
            window.location.href = '/login';
         } else {
            throw new Error(data.error || 'Deletion failed');
         }
      } catch (error) {
         console.error('Delete account error:', error);
         toast.error(t('profile.deleteError'));
         setIsDeleting(false);
      }
   };

   const getInitials = (name: string) => {
      return name
         .split(' ')
         .map(n => n[0])
         .join('')
         .toUpperCase()
         .substring(0, 2);
   };

   return (
      <DashboardLayout selectedLang={currentLocale} onLanguageChange={setLocale} domains={domainsData?.domains || []}>
         <Head>
            <title>{t('profile.title')} - SEO AI Agent</title>
         </Head>

         <div className="max-w-4xl">
            <div className="mb-8">
               <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('profile.title')}</h1>
               <p className="text-neutral-600">{t('profile.description')}</p>
            </div>

            <div className="grid gap-8">
               {/* Public Profile Card */}
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.cardTitle')}</CardTitle>
                     <CardDescription>{t('profile.cardDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     {/* Avatar Section */}
                     <div className="flex items-center gap-6">
                        <div className="relative group">
                           <Avatar className="h-24 w-24 border-2 border-white shadow-lg">
                              <AvatarImage src={user.picture} alt={user.name} />
                              <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                                 {getInitials(user.name || 'User')}
                              </AvatarFallback>
                           </Avatar>
                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Camera className="h-6 w-6 text-white" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <h3 className="font-medium">{t('profile.photoTitle')}</h3>
                           <p className="text-sm text-gray-500">
                              {t('profile.photoDesc')}
                           </p>
                           <Button variant="outline" size="sm" type="button" className="mt-2">
                              {t('profile.changePhoto')}
                           </Button>
                        </div>
                     </div>

                     <Separator />

                     {/* Form Fields */}
                     <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                           <Label htmlFor="name">{t('profile.fullName')}</Label>
                           <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                 id="name"
                                 className="pl-9"
                                 value={formData.name}
                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                 placeholder="John Doe"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="email">{t('profile.email')}</Label>
                           <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <Input
                                 id="email"
                                 className="pl-9 bg-gray-50"
                                 value={formData.email}
                                 readOnly
                                 disabled
                                 placeholder="email@example.com"
                              />
                           </div>
                           <p className="text-xs text-gray-500">
                              {t('profile.emailNote')}
                           </p>
                        </div>
                     </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t bg-gray-50/50 p-4">
                     <Button onClick={handleUpdateProfile} disabled={isSaving || isLoading}>
                        {isSaving ? (
                           <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('profile.saving')}
                           </>
                        ) : (
                           <>
                              <Save className="mr-2 h-4 w-4" />
                              {t('profile.save')}
                           </>
                        )}
                     </Button>
                  </CardFooter>
               </Card>

               {/* Language Settings Card */}
               <Card>
                  <CardHeader>
                     <CardTitle>{t('profile.languageSettingsTitle')}</CardTitle>
                     <CardDescription>{t('profile.languageSettingsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                           <Label htmlFor="language">{t('profile.language')}</Label>
                           <Select value={currentLocale} onValueChange={async (val: 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'zh' | 'nl') => {
                              setLocale(val);
                              // Explicitly save to ensure DB is updated
                              try {
                                 const token = localStorage.getItem('auth_token');
                                 if (token) {
                                    await fetch('/api/user', {
                                       method: 'PUT',
                                       headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${token}`
                                       },
                                       body: JSON.stringify({ language: val })
                                    });
                                    toast.success(`Language saved: ${val}`);
                                 }
                              } catch (e) {
                                 console.error("Failed to save language", e);
                              }
                           }}>
                              <SelectTrigger id="language">
                                 <SelectValue placeholder="Select Language" />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="en">English</SelectItem>
                                 <SelectItem value="de">Deutsch</SelectItem>
                                 <SelectItem value="fr">Français</SelectItem>
                                 <SelectItem value="es">Español</SelectItem>
                                 <SelectItem value="it">Italiano</SelectItem>
                                 <SelectItem value="pt">Português</SelectItem>
                                 <SelectItem value="zh">中文</SelectItem>
                                 <SelectItem value="nl">Nederlands</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Delete Account Card */}
               <Card className="border-red-200 bg-red-50/10">
                  <CardHeader>
                     <div className="flex items-center gap-2 text-red-600 mb-1">
                        <AlertTriangle className="h-5 w-5" />
                        <CardTitle className="text-red-600">{t('profile.deleteAccountTitle')}</CardTitle>
                     </div>
                     <CardDescription>{t('profile.deleteAccountDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {!showDeleteConfirm ? (
                        <div className="flex justify-start">
                           <Button
                              variant="destructive"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="w-full sm:w-auto"
                           >
                              {t('profile.deleteButton')}
                           </Button>
                        </div>
                     ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                           <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                              {t('profile.deleteWarning')}
                           </div>
                           <div className="max-w-md space-y-2">
                              <Label htmlFor="delete-confirm" className="sr-only">Confirmation</Label>
                              <Input
                                 id="delete-confirm"
                                 placeholder={t('profile.deletePlaceholder')}
                                 value={deleteConfirmation}
                                 onChange={(e) => setDeleteConfirmation(e.target.value)}
                                 className="border-red-200 focus-visible:ring-red-500"
                              />
                           </div>
                           <div className="flex gap-2 justify-end">
                              <Button
                                 variant="outline"
                                 onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmation('');
                                 }}
                              >
                                 Cancel
                              </Button>
                              <Button
                                 variant="destructive"
                                 onClick={handleDeleteAccount}
                                 disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                              >
                                 {isDeleting ? (
                                    <>
                                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                       {t('profile.deleting')}
                                    </>
                                 ) : (
                                    t('profile.deleteButton')
                                 )}
                              </Button>
                           </div>
                        </div>
                     )}
                  </CardContent>
               </Card>
            </div>
         </div>

      </DashboardLayout>
   );
};

export default ProfilePage;
