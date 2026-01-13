import { useRouter } from 'next/router';
import React, { useState, useMemo } from 'react';
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
               <span className='text-xs font-medium text-gray-500 uppercase'>Keywords</span>
               <Icon type="search" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-gray-800'>{formattedNum(finalKeywords[device]?.length || 0)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>Avg Position</span>
               <Icon type="tracking" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-blue-600'>{Math.round(viewSummary.position)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>Total Visits</span>
               <Icon type="mouse-pointer" size={16} color="#6B7280" />
            </div>
            <div className='text-2xl font-bold text-violet-600'>{formattedNum(viewSummary.visits)}</div>
         </div>
         <div className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm'>
            <div className='flex items-center justify-between mb-2'>
               <span className='text-xs font-medium text-gray-500 uppercase'>Avg CTR</span>
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
                           Add {selectedKeywords.length} Keywords to Tracker
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
                           Keyword{getSortIcon('keyword')}
                        </span>
                     </span>
                     <span
                        className='domKeywords_head_position flex-1 basis-40 grow-0 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('position')}
                     >
                        Position{getSortIcon('position')}
                     </span>
                     <span
                        className='domKeywords_head_imp flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('impressions')}
                     >
                        Impressions{getSortIcon('impressions')}
                     </span>
                     <span
                        className='domKeywords_head_visits flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('visits')}
                     >
                        Visits{getSortIcon('visits')}
                     </span>
                     <span
                        className='domKeywords_head_ctr flex-1 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('ctr')}
                     >
                        CTR{getSortIcon('ctr')}
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
                           <p className="text-lg font-medium">No keywords found</p>
                           <p className="text-sm mt-2">Try adjusting your filters.</p>
                        </div>
                     )}
                     {!isConsoleIntegrated && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                           </svg>
                           <p className="text-lg font-medium">Google Search Console Not Integrated</p>
                           <p className="text-sm mt-2">Connect your account in Settings to see keywords.</p>
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
