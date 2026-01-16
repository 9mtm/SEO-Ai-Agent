import { useRouter } from 'next/router';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { useAddKeywords, useFetchKeywords } from '../../services/keywords';
import { SCfilterKeywords, SCkeywordsByDevice, SCsortKeywords } from '../../utils/client/SCsortFilter';
import Icon from '../common/Icon';
import KeywordFilters from './KeywordFilter';
import SCKeyword from './SCKeyword';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import { formattedNum } from '../../utils/client/helpers';
import { useLanguage } from '../../context/LanguageContext';

type SCKeywordsTableProps = {
   domain: DomainType | null,
   keywords: SearchAnalyticsItem[],
   isPending: boolean,
   isConsoleIntegrated: boolean,
}

type SCCountryDataType = {
   keywords: number,
   impressions: number,
   visits: number
}

const SCKeywordsTable = ({ domain, keywords = [], isPending = true, isConsoleIntegrated = true }: SCKeywordsTableProps) => {
   const router = useRouter();
   const { t } = useLanguage();
   const [device, setDevice] = useState<string>('desktop');
   const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
   const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
   const [sortBy, setSortBy] = useState<string>('imp_desc');
   const [SCListHeight, setSCListHeight] = useState(500);
   const { keywordsData } = useFetchKeywords(router, domain?.domain || '');
   const addedkeywords: string[] = keywordsData?.keywords?.map((key: KeywordType) => `${key.keyword}:${key.country}:${key.device}`) || [];
   const { mutate: addKeywords } = useAddKeywords(() => { if (domain && domain.slug) router.push(`/domain/${domain.slug}`); });
   const [isMobile] = useIsMobile();
   useWindowResize(() => setSCListHeight(window.innerHeight - (isMobile ? 200 : 400)));

   const handleColumnSort = (column: string) => {
      const sortMap: { [key: string]: { asc: string, desc: string } } = {
         keyword: { asc: 'alpha_asc', desc: 'alpha_desc' },
         position: { asc: 'pos_asc', desc: 'pos_desc' },
         impressions: { asc: 'imp_asc', desc: 'imp_desc' },
         visits: { asc: 'visits_asc', desc: 'visits_desc' },
         ctr: { asc: 'ctr_asc', desc: 'ctr_desc' },
      };

      const currentSort = sortMap[column];
      if (!currentSort) return;

      const isCurrentlyAsc = sortBy === currentSort.asc;
      setSortBy(isCurrentlyAsc ? currentSort.desc : currentSort.asc);
   };

   const getSortIcon = (column: string) => {
      const sortMap: { [key: string]: { asc: string, desc: string } } = {
         keyword: { asc: 'alpha_asc', desc: 'alpha_desc' },
         position: { asc: 'pos_asc', desc: 'pos_desc' },
         impressions: { asc: 'imp_asc', desc: 'imp_desc' },
         visits: { asc: 'visits_asc', desc: 'visits_desc' },
         ctr: { asc: 'ctr_asc', desc: 'ctr_desc' },
      };

      const currentSort = sortMap[column];
      if (!currentSort) return null;

      if (sortBy === currentSort.asc) return ' ↑';
      if (sortBy === currentSort.desc) return ' ↓';
      return null;
   };

   const finalKeywords: { [key: string]: SCKeywordType[] } = useMemo(() => {
      const procKeywords = keywords.filter((x) => x.device === device);
      const filteredKeywords = SCfilterKeywords(procKeywords, filterParams);
      const sortedKeywords = SCsortKeywords(filteredKeywords, sortBy);
      return SCkeywordsByDevice(sortedKeywords, device);
   }, [keywords, device, filterParams, sortBy]);

   const SCCountryData: { [key: string]: SCCountryDataType } = useMemo(() => {
      const countryData: { [key: string]: SCCountryDataType } = {};

      Object.keys(finalKeywords).forEach((dateKey) => {
         finalKeywords[dateKey].forEach((keyword) => {
            const kCountry = keyword.country;
            if (!countryData[kCountry]) { countryData[kCountry] = { keywords: 0, impressions: 0, visits: 0 }; }
            countryData[kCountry].keywords += 1;
            countryData[kCountry].visits += (keyword.clicks || 0);
            countryData[kCountry].impressions += (keyword.impressions || 0);
         });
      });

      return countryData;
   }, [finalKeywords]);

   const viewSummary: { [key: string]: number } = useMemo(() => {
      const keyCount = finalKeywords[device].length;
      const kwSummary = { position: 0, impressions: 0, visits: 0, ctr: 0 };
      finalKeywords[device].forEach((k) => {
         kwSummary.position += k.position;
         kwSummary.impressions += k.impressions;
         kwSummary.visits += k.clicks;
         kwSummary.ctr += k.ctr;
      });
      return {
         ...kwSummary,
         position: Math.round(kwSummary.position / keyCount),
         ctr: kwSummary.ctr / keyCount,
      };
   }, [finalKeywords, device]);

   const selectKeyword = (keywordID: string) => {
      console.log('Select Keyword: ', keywordID);
      let updatedSelectd = [...selectedKeywords, keywordID];
      if (selectedKeywords.includes(keywordID)) {
         updatedSelectd = selectedKeywords.filter((keyID) => keyID !== keywordID);
      }
      setSelectedKeywords(updatedSelectd);
   };

   const addSCKeywordsToTracker = () => {
      const selectedkeywords: KeywordAddPayload[] = [];
      keywords.forEach((kitem: SCKeywordType) => {
         if (selectedKeywords.includes(kitem.uid)) {
            const { keyword, country } = kitem;
            selectedkeywords.push({ keyword, device, country, domain: domain?.domain || '', tags: '' });
         }
      });
      addKeywords(selectedkeywords);
      setSelectedKeywords([]);
   };

   const selectedAllItems = selectedKeywords.length === finalKeywords[device].length;

   const Row = ({ data, index, style }: ListChildComponentProps) => {
      const keyword = data[index];
      return (
         <div style={style}>
            <SCKeyword
               key={keyword.uid}
               style={{}}
               selected={selectedKeywords.includes(keyword.uid)}
               selectKeyword={selectKeyword}
               keywordData={keyword}
               isTracked={addedkeywords.includes(`${keyword.keyword}:${keyword.country}:${keyword.device}`)}
               lastItem={index === (finalKeywords[device].length - 1)}
            />
         </div>
      );
   };

   // Stats Cards Componenent
   const StatsCards = () => (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200'>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>{t('insight.keywords')}</span>
               <Icon type="search" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-gray-800'>{formattedNum(finalKeywords[device]?.length || 0)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>{t('insight.avgPosition')}</span>
               <Icon type="tracking" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-blue-600'>{Math.round(viewSummary.position)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>{t('scTable.totalVisits')}</span>
               <Icon type="mouse-pointer" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-violet-600'>{formattedNum(viewSummary.visits)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>{t('insight.avgCtr')}</span>
               <Icon type="percent" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-emerald-600'>
               {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(viewSummary.ctr)}%
            </div>
         </div>
      </div>
   );

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-4 shadow-sm overflow-hidden'>
            {/* Stats Cards */}
            {!isPending && finalKeywords[device] && finalKeywords[device].length > 0 && <StatsCards />}

            {selectedKeywords.length > 0 && (
               <div className='font-semibold text-sm py-4 px-8 text-gray-500 bg-blue-50 border-b border-blue-100'>
                  <ul className=''>
                     <li className='inline-block mr-4'>
                        <a
                           className='block px-2 py-2 cursor-pointer hover:text-indigo-600 flex items-center'
                           onClick={() => addSCKeywordsToTracker()}
                        >
                           <span className='bg-indigo-100 text-blue-700 px-1.5 py-0.5 rounded font-black mr-2 text-xs'>+</span>
                           {t('scTable.addToTracker', { count: selectedKeywords.length })}
                        </a>
                     </li>
                  </ul>
               </div>
            )}
            {selectedKeywords.length === 0 && (
               <KeywordFilters
                  allTags={[]}
                  filterParams={filterParams}
                  filterKeywords={(params: KeywordFilters) => setFilterParams(params)}
                  updateSort={(sorted: string) => setSortBy(sorted)}
                  sortBy={sortBy}
                  keywords={keywords}
                  device={device}
                  setDevice={setDevice}
                  isConsole={true}
                  integratedConsole={isConsoleIntegrated}
                  SCcountries={Object.keys(SCCountryData)}
               />
            )}
            <div className='domkeywordsTable domkeywordsTable--sckeywords styled-scrollbar w-full overflow-auto min-h-[60vh]'>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domKeywords_head domKeywords_head--${sortBy} hidden lg:flex p-3 px-6 bg-[#FCFCFF]
                   text-gray-600 justify-between items-center font-semibold border-y border-gray-100 text-xs uppercase tracking-wider`}>
                     <span className='domKeywords_head_keyword flex-1 basis-20 w-auto flex items-center'>
                        {finalKeywords[device].length > 0 && (
                           <button
                              className={`p-0 mr-3 leading-[0px] inline-flex items-center justify-center rounded w-4 h-4 border border-gray-300 transition-colors
                           ${selectedAllItems ? ' bg-blue-600 border-blue-600 text-white' : 'hover:border-blue-400'}`}
                              onClick={() => setSelectedKeywords(selectedAllItems ? [] : finalKeywords[device].map((k: SearchAnalyticsItem) => k.uid))}
                           >
                              {selectedAllItems && <Icon type="check" size={10} />}
                           </button>
                        )}
                        <span
                           className='cursor-pointer hover:text-blue-700 select-none flex items-center'
                           onClick={() => handleColumnSort('keyword')}
                        >
                           {t('insight.keywords')}{getSortIcon('keyword')}
                        </span>
                     </span>
                     <span
                        className='domKeywords_head_position flex-1 basis-40 grow-0 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('position')}
                     >
                        {t('insight.position')}{getSortIcon('position')}
                     </span>
                     <span
                        className='domKeywords_head_imp flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('impressions')}
                     >
                        {t('insight.impressions')}{getSortIcon('impressions')}
                     </span>
                     <span
                        className='domKeywords_head_visits flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('visits')}
                     >
                        {t('insight.visits')}{getSortIcon('visits')}
                     </span>
                     <span
                        className='domKeywords_head_ctr flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('ctr')}
                     >
                        {t('insight.ctr')}{getSortIcon('ctr')}
                     </span>
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative' data-domain={domain?.domain}>
                     {!isPending && finalKeywords[device] && finalKeywords[device].length > 0 && (
                        <List
                           innerElementType="div"
                           itemData={finalKeywords[device]}
                           itemCount={finalKeywords[device].length}
                           itemSize={isMobile ? 100 : 70}
                           height={SCListHeight}
                           width={'100%'}
                           className={'styled-scrollbar'}
                        >
                           {Row}
                        </List>
                     )}

                     {/* Empty States */}
                     {isConsoleIntegrated && !isPending && finalKeywords[device].length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                           <p className="text-lg font-medium">{t('scTable.noKeywords')}</p>
                           <p className="text-sm mt-2">{t('scTable.adjustFilters')}</p>
                        </div>
                     )}
                     {!isConsoleIntegrated && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" />
                              </svg>
                           </div>
                           <p className="text-lg font-medium text-gray-900">{t('insight.connectTitle')}</p>
                           <p className="text-sm mt-2 mb-6 text-gray-500">{t('insight.connectDesc')}</p>

                           <Link
                              href="/settings?tab=search_console"
                              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center"
                           >
                              {t('insight.connectBtn')}
                           </Link>
                        </div>
                     )}

                     {/* Skeleton Loader */}
                     {isConsoleIntegrated && isPending && (
                        <div className="p-4">
                           {Array(8).fill(0).map((_, i) => (
                              <div key={i} className='flex items-center justify-between py-4 border-b border-gray-100 animate-pulse'>
                                 <div className='flex items-center flex-1'>
                                    <div className='w-4 h-4 bg-gray-200 rounded mr-3'></div>
                                    <div className='w-48 h-5 bg-gray-200 rounded'></div>
                                 </div>
                                 <div className='flex-1 flex justify-center'><div className='w-12 h-5 bg-gray-200 rounded'></div></div>
                                 <div className='flex-1 flex justify-center'><div className='w-16 h-5 bg-gray-200 rounded'></div></div>
                                 <div className='flex-1 flex justify-center'><div className='w-16 h-5 bg-gray-200 rounded'></div></div>
                                 <div className='flex-1 flex justify-center'><div className='w-12 h-5 bg-gray-200 rounded'></div></div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default SCKeywordsTable;
