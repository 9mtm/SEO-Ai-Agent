import React, { useCallback, useMemo, useRef, useState } from 'react';
import Icon from '../common/Icon';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import countries from '../../utils/countries';
import { useAddKeywords } from '../../services/keywords';
import { useLanguage } from '../../context/LanguageContext';

type AddKeywordsProps = {
   keywords: KeywordType[],
   scraperName: string,
   allowsCity: boolean,
   closeModal: Function,
   domain: string
}

type KeywordsInput = {
   keywords: string,
   device: string,
   country: string,
   domain: string,
   tags: string,
   city?: string,
   track_competitors?: boolean,
}

import { useUserUsage } from '../../services/settings';

const AddKeywords = ({ closeModal, domain, keywords, scraperName = '', allowsCity = false }: AddKeywordsProps) => {
   const { t } = useLanguage();
   const inputRef = useRef(null);
   const defCountry = localStorage.getItem('default_country') || 'US';
   const { data: usageData } = useUserUsage();

   const [error, setError] = useState<string>('');
   const [showTagSuggestions, setShowTagSuggestions] = useState(false);
   const [newKeywordsData, setNewKeywordsData] = useState<KeywordsInput>({ keywords: '', device: 'desktop', country: defCountry, domain, tags: '', track_competitors: false });
   const { mutate: addMutate, isPending: isAdding } = useAddKeywords(() => closeModal(false));

   const existingTags: string[] = useMemo(() => {
      const allTags = keywords.reduce((acc: string[], keyword) => [...acc, ...keyword.tags], []).filter((t) => t && t.trim() !== '');
      return [...new Set(allTags)];
   }, [keywords]);

   const setDeviceType = useCallback((input: string) => {
      let updatedDevice = '';
      if (newKeywordsData.device.includes(input)) {
         updatedDevice = newKeywordsData.device.replace(',', '').replace(input, '');
      } else {
         updatedDevice = newKeywordsData.device ? `${newKeywordsData.device},${input}` : input;
      }
      setNewKeywordsData({ ...newKeywordsData, device: updatedDevice });
   }, [newKeywordsData]);

   // Calculate Counts
   const devicesCount = newKeywordsData.device.split(',').filter(d => d).length;
   const keywordsList = useMemo(() => newKeywordsData.keywords.split('\n').filter(k => k.trim()), [newKeywordsData.keywords]);
   const countToAdd = keywordsList.length * devicesCount;

   const limit = usageData?.limits?.keywords || 0;
   const currentUsage = usageData?.usage?.keywords || 0;
   const remaining = Math.max(0, limit - currentUsage);
   const isOverLimit = countToAdd > remaining;

   const addKeywords = () => {
      const nkwrds = newKeywordsData;
      if (isOverLimit) {
         setError(t('tracking.addKeywords.errorLimit', { count: countToAdd, remaining }));
         return;
      }
      if (nkwrds.keywords) {
         const devices = nkwrds.device.split(',');
         const multiDevice = nkwrds.device.includes(',') && devices.length > 1;
         const keywordsArray = [...new Set(nkwrds.keywords.split('\n').map((item) => item.trim()).filter((item) => !!item))];
         const currentKeywords = keywords.map((k) => `${k.keyword}-${k.device}-${k.country}${k.city ? `-${k.city}` : ''}`);

         const keywordExist = keywordsArray.filter((k) =>
            devices.some((device) => currentKeywords.includes(`${k}-${device}-${nkwrds.country}${nkwrds.city ? `-${nkwrds.city}` : ''}`)),
         );

         if (!multiDevice && (keywordsArray.length === 1 || currentKeywords.length === keywordExist.length) && keywordExist.length > 0) {
            setError(t('tracking.addKeywords.errorExist', { keywords: keywordExist.join(',') }));
            setTimeout(() => { setError(''); }, 3000);
         } else {
            const newKeywords = keywordsArray.flatMap((k) =>
               devices.filter((device) =>
                  !currentKeywords.includes(`${k}-${device}-${nkwrds.country}${nkwrds.city ? `-${nkwrds.city}` : ''}`),
               ).map((device) => ({
                  keyword: k,
                  device,
                  country: nkwrds.country,
                  domain: nkwrds.domain,
                  tags: nkwrds.tags,
                  city: nkwrds.city,
                  track_competitors: nkwrds.track_competitors,
               })),
            );
            addMutate(newKeywords);
         }
      } else {
         setError(t('tracking.addKeywords.errorEmpty'));
         setTimeout(() => { setError(''); }, 3000);
      }
   };

   const deviceTabStyle = 'cursor-pointer px-3 py-1.5 rounded-md text-sm border transition-all flex items-center gap-1.5';

   return (
      <Modal closeModal={() => { closeModal(false); }} title={t('tracking.addKeywords.title')} width="full" maxWidth="max-w-3xl">
         <div data-testid="addkeywords_modal" className="px-1">

            {/* Usage Stats Bar */}
            <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between">
               <div className="text-xs text-gray-500 font-medium">{t('tracking.addKeywords.planUsage') || 'Plan Usage'}:</div>
               <div className="flex items-center gap-2">
                  <div className="text-xs font-bold text-gray-700">
                     {currentUsage} / {limit === 99999 ? '∞' : limit}
                  </div>
                  {limit !== 99999 && (
                     <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                           className={`h-full rounded-full ${currentUsage >= limit ? 'bg-red-500' : 'bg-blue-500'}`}
                           style={{ width: `${Math.min(100, (currentUsage / limit) * 100)}%` }}
                        ></div>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               {/* Keywords Input */}
               <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">
                     {t('tracking.addKeywords.enterKeywords') || 'Keywords'}
                  </label>
                  <div className="relative">
                     <textarea
                        className='w-full h-32 border rounded-xl border-gray-200 p-4 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none text-sm'
                        placeholder={t('tracking.addKeywords.placeholder')}
                        value={newKeywordsData.keywords}
                        onChange={(e) => setNewKeywordsData({ ...newKeywordsData, keywords: e.target.value })}>
                     </textarea>
                     <div className={`absolute bottom-3 right-3 text-xs font-medium px-2 py-1 rounded-md bg-white border shadow-sm
                        ${isOverLimit ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-500 border-gray-100'}`}>
                        {countToAdd} {t('tracking.addKeywords.adding') || 'adding'}
                     </div>
                  </div>
                  {isOverLimit && (
                     <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 font-medium">
                        <Icon type="warning" size={14} />
                        <span>You can only add {remaining} more keywords.</span>
                     </div>
                  )}
               </div>

               {/* Settings Grid */}
               <div className='grid grid-cols-2 gap-4'>
                  <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">
                        {t('tracking.addKeywords.country') || 'Country'}
                     </label>
                     <SelectField
                        multiple={false}
                        selected={[newKeywordsData.country]}
                        options={Object.keys(countries).map((countryISO: string) => { return { label: countries[countryISO][0], value: countryISO }; })}
                        defaultLabel='All Countries'
                        updateField={(updated: string[]) => {
                           setNewKeywordsData({ ...newKeywordsData, country: updated[0] });
                           localStorage.setItem('default_country', updated[0]);
                        }}
                        rounded='rounded-lg'
                        maxHeight={48}
                        flags={true}
                     />
                  </div>

                  <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">
                        {t('tracking.addKeywords.device') || 'Device'}
                     </label>
                     <div className='flex gap-2'>
                        <div
                           className={`${deviceTabStyle} ${newKeywordsData.device.includes('desktop') ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                           onClick={() => setDeviceType('desktop')}>
                           <Icon type='desktop' size={14} />
                           <span>Desktop</span>
                        </div>
                        <div
                           className={`${deviceTabStyle} ${newKeywordsData.device.includes('mobile') ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                           onClick={() => setDeviceType('mobile')}>
                           <Icon type='mobile' size={14} />
                           <span>Mobile</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Tags & City */}
               <div className="grid grid-cols-2 gap-4">
                  <div className='relative'>
                     <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">
                        {t('tracking.addKeywords.tags') || 'Tags'}
                     </label>
                     <div className="relative">
                        <input
                           className='w-full border rounded-lg border-gray-200 py-2.5 pl-9 pr-8 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all text-sm'
                           placeholder={t('tracking.addKeywords.tagsPlaceholder')}
                           value={newKeywordsData.tags}
                           onChange={(e) => setNewKeywordsData({ ...newKeywordsData, tags: e.target.value })}
                        />
                        <span className='absolute text-gray-400 top-3 left-3 pointer-events-none'>
                           <Icon type="tags" size={14} />
                        </span>
                        <span className='absolute text-gray-400 top-3 right-3 cursor-pointer hover:text-gray-600' onClick={() => setShowTagSuggestions(!showTagSuggestions)}>
                           <Icon type={showTagSuggestions ? 'caret-up' : 'caret-down'} size={14} />
                        </span>
                     </div>
                     {showTagSuggestions && (
                        <ul className={`absolute z-50 mt-1
                        bg-white border border-gray-100 rounded-lg shadow-xl w-full max-h-48 overflow-y-auto py-1`}>
                           {existingTags.length > 0 ? existingTags.map((tag, index) => (
                              !newKeywordsData.tags.split(',').map((t) => t.trim()).includes(tag) && (
                                 <li
                                    className='px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-sm flex items-center gap-2'
                                    key={index}
                                    onClick={() => {
                                       const tagInput = newKeywordsData.tags;
                                       const tagToInsert = tagInput + (tagInput.trim().slice(-1) === ',' ? '' : (tagInput.trim() ? ', ' : '')) + tag;
                                       setNewKeywordsData({ ...newKeywordsData, tags: tagToInsert });
                                       setShowTagSuggestions(false);
                                       if (inputRef?.current) (inputRef.current as HTMLInputElement).focus();
                                    }}>
                                    <Icon type='tags' size={12} /> {tag}
                                 </li>
                              )
                           )) : (
                              <p className="px-3 py-2 text-xs text-gray-500">{t('tracking.addKeywords.noTags')}</p>
                           )}
                        </ul>
                     )}
                  </div>

                  <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block tracking-wide">
                        {t('tracking.addKeywords.city') || 'City'}
                     </label>
                     <div className='relative'>
                        <input
                           className={`w-full border rounded-lg border-gray-200 py-2.5 pl-9 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all text-sm ${!allowsCity ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''} `}
                           disabled={!allowsCity}
                           title={!allowsCity ? t('tracking.addKeywords.cityTooltip', { scraper: scraperName }) : ''}
                           placeholder={!allowsCity ? t('tracking.addKeywords.cityDisabled', { scraper: scraperName }) : t('tracking.addKeywords.cityPlaceholder')}
                           value={newKeywordsData.city}
                           onChange={(e) => setNewKeywordsData({ ...newKeywordsData, city: e.target.value })}
                        />
                        <span className='absolute text-gray-400 top-3 left-3'><Icon type="city" size={14} /></span>
                     </div>
                  </div>
               </div>

               {/* Track Competitors */}
               <div className='flex items-center gap-2 pt-1'>
                  <div className="relative flex items-center">
                     <input
                        type="checkbox"
                        id="track_competitors"
                        className='peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
                        checked={newKeywordsData.track_competitors}
                        onChange={(e) => setNewKeywordsData({ ...newKeywordsData, track_competitors: e.target.checked })}
                     />
                  </div>
                  <label htmlFor="track_competitors" className='text-sm text-gray-700 cursor-pointer select-none font-medium flex items-center gap-1.5'>
                     <Icon type="users" size={14} classes="text-gray-500" />
                     {t('tracking.addKeywords.trackCompetitors')}
                  </label>
               </div>
            </div>

            {error && (
               <div className='mt-4 p-3 text-sm bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-center gap-2 animate-pulse'>
                  <Icon type="warning" size={16} />
                  {error}
               </div>
            )}

            <div className='mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3'>
               <button
                  className='px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors'
                  onClick={() => closeModal(false)}>
                  {t('tracking.addKeywords.cancel')}
               </button>
               <button
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all flex items-center gap-2
                     ${isOverLimit || isAdding
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
                  disabled={isOverLimit || isAdding}
                  onClick={() => !isAdding && !isOverLimit && addKeywords()}>
                  {isAdding && <Icon type="reload" size={14} classes="animate-spin" />}
                  {isAdding ? t('tracking.addKeywords.adding') : t('tracking.addKeywords.add')}
               </button>
            </div>
         </div>
      </Modal>
   );
};

export default AddKeywords;
