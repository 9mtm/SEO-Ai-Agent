import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { sortInsightItems } from '../../utils/insight';
import SelectField from '../common/SelectField';
import InsightItem from './InsightItem';
import InsightStats from './InsightStats';
import { useLanguage } from '../../context/LanguageContext';

type BingInsightProps = {
   domain: DomainType | null;
   isBingConnected?: boolean;
   daysFilter?: number;
   setDaysFilter?: (days: number) => void;
};

type BingKeyword = {
   keyword: string;
   clicks: number;
   impressions: number;
   position: number;
   ctr: number;
   page?: string;
   countries?: number;
};

const BingInsight = ({ domain, isBingConnected = false, daysFilter = 30, setDaysFilter }: BingInsightProps) => {
   const { t, locale } = useLanguage();
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [allChart, setAllChart] = useState<SearchAnalyticsStat[]>([]);
   const [allKeywords, setAllKeywords] = useState<BingKeyword[]>([]);
   const [activeTab, setActiveTab] = useState<string>('stats');
   const [sortBy, setSortBy] = useState<string>('clicks');
   const [searchQuery, setSearchQuery] = useState<string>('');
   const [currentPage, setCurrentPage] = useState<number>(1);
   const itemsPerPage = 20;

   // Fetch once with max range (90 days), filter client-side
   useEffect(() => {
      if (!domain?.domain || !isBingConnected) {
         setLoading(false);
         return;
      }

      const fetchBingData = async () => {
         setLoading(true);
         setError(null);
         try {
            const token = localStorage.getItem('auth_token');
            const headers: Record<string, string> = {};
            if (token) headers.Authorization = `Bearer ${token}`;

            const siteUrl = domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain}`;
            const res = await fetch(`/api/bing/stats?siteUrl=${encodeURIComponent(siteUrl)}&days=90`, { headers });

            if (!res.ok) {
               const data = await res.json();
               throw new Error(data.error || 'Failed to fetch Bing data');
            }

            const data = await res.json();
            setAllChart(data.chart || []);
            setAllKeywords(data.keywords || []);
         } catch (err: any) {
            setError(err.message);
         } finally {
            setLoading(false);
         }
      };

      fetchBingData();
   }, [domain?.domain]);

   // Client-side filter by daysFilter — instant, no API call
   const { chart, keywords } = useMemo(() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysFilter);
      const cutoffStr = cutoff.toISOString().split('T')[0];

      const filteredChart = allChart.filter(s => s.date >= cutoffStr);
      // Keywords don't have per-day granularity here, so show all
      return { chart: filteredChart, keywords: allKeywords };
   }, [allChart, allKeywords, daysFilter]);

   // Derive insight-compatible data structure
   const insight = useMemo(() => {
      return {
         stats: chart,
         keywords: keywords.map(k => ({
            ...k,
            countries: 0,
         })),
         pages: [] as SCInsightItem[],
         countries: [] as SCInsightItem[],
      };
   }, [chart, keywords]);

   const startDate = chart.length > 0 ? new Date(chart[0].date) : null;
   const endDate = chart.length > 0 ? new Date(chart[chart.length - 1].date) : null;

   const insightItems = insight[activeTab as keyof typeof insight];

   const switchTab = (tab: string) => {
      setActiveTab(tab);
      setSortBy('clicks');
      setSearchQuery('');
      setCurrentPage(1);
   };

   const handleSort = (column: string) => {
      if (sortBy === `${column}_desc`) {
         setSortBy(`${column}_asc`);
      } else {
         setSortBy(`${column}_desc`);
      }
   };

   const getSortIcon = (column: string) => {
      if (sortBy === `${column}_asc`) return ' ↑';
      if (sortBy === `${column}_desc`) return ' ↓';
      return null;
   };

   // Filter and paginate items
   const { filteredItems, totalPages, topPerformers } = useMemo(() => {
      if (!insightItems) return { filteredItems: [], totalPages: 0, topPerformers: [] };

      let items = activeTab === 'stats' ? [...insightItems].reverse() : sortInsightItems(insightItems, sortBy);

      // Filter by search query
      if (searchQuery && activeTab !== 'stats') {
         const qLower = searchQuery.toLowerCase();
         items = items.filter((item: SCInsightItem) => {
            const searchText = (item.keyword || item.page || item.country || '').toLowerCase();
            return searchText.includes(qLower);
         });
      }

      // Get top 5 performers
      const top = activeTab !== 'stats' && items.length > 0
         ? items.slice(0, 5)
         : [];

      // Paginate
      const total = Math.ceil(items.length / itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      const paginated = items.slice(start, start + itemsPerPage);

      return { filteredItems: paginated, totalPages: total, topPerformers: top };
   }, [insightItems, sortBy, searchQuery, currentPage, activeTab]);

   const renderTableHeader = () => {
      const headerNames: { [key: string]: { label: string, key: string }[] } = {
         stats: [
            { label: t('insight.date'), key: 'date' },
            { label: t('insight.avgPosition'), key: 'position' },
            { label: t('insight.visits'), key: 'clicks' },
            { label: t('insight.impressions'), key: 'impressions' },
            { label: t('insight.ctr'), key: 'ctr' }
         ],
         keywords: [
            { label: t('insight.keywords'), key: 'keyword' },
            { label: t('insight.avgPosition'), key: 'position' },
            { label: t('insight.visits'), key: 'clicks' },
            { label: t('insight.impressions'), key: 'impressions' },
            { label: t('insight.ctr'), key: 'ctr' },
         ],
      };

      const headers = headerNames[activeTab] || [];

      return (
         <div className='domKeywords_header hidden text-xs text-gray-500 font-semibold px-6 py-3 border-b-[1px] border-gray-200 lg:flex lg:justify-between lg:items-center'>
            {headers.map((header, index) => {
               let className = 'flex-1 text-center';
               if (index === 0) className = 'domKeywords_head_keyword flex-1 basis-20 w-auto text-left';
               else if (header.key === 'position') className = 'domKeywords_head_position flex-1 basis-40 grow-0 text-center';

               return (
                  <span
                     key={header.key}
                     className={`${className} cursor-pointer hover:text-blue-700 select-none`}
                     onClick={() => handleSort(header.key)}
                  >
                     {header.label}{getSortIcon(header.key)}
                  </span>
               );
            })}
         </div>
      );
   };

   const exportToCSV = () => {
      if (!filteredItems || filteredItems.length === 0) return;

      const headers = activeTab === 'keywords'
         ? ['Keyword', 'Position', 'Clicks', 'Impressions', 'CTR']
         : ['Date', 'Position', 'Clicks', 'Impressions', 'CTR'];

      const rows = filteredItems.map((item: SCInsightItem) => {
         if (activeTab === 'keywords') {
            return [item.keyword, item.position, item.clicks, item.impressions, item.ctr];
         }
         return [item.date, item.position, item.clicks, item.impressions, item.ctr];
      });

      const csvContent = [
         headers.join(','),
         ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bing-${activeTab}-${domain?.domain || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
   };

   const deviceTabStyle = 'select-none cursor-pointer px-4 py-2.5 rounded-lg mr-2 transition-all duration-200 font-medium';
   const deviceTabCountStyle = 'px-2 py-0.5 rounded-full bg-violet-100 text-[0.7rem] font-bold ml-2 text-violet-700';

   const tabsList = ['stats', 'keywords'];

   if (error) {
      return (
         <div className='domKeywords flex flex-col bg-white rounded-md text-sm border mb-5 shadow-sm'>
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
               </div>
               <p className="text-lg font-medium text-gray-900">{t('insight.bingError')}</p>
               <p className="text-sm mt-2 mb-6 text-red-500">{error}</p>
            </div>
         </div>
      );
   }

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5 shadow-sm'>
            <div className='domKeywords_filters py-4 px-6 flex flex-col justify-between
            text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0 lg:flex-row'>
               <div className='flex items-center justify-between w-full lg:w-auto'>
                  <ul className='text-xs hidden lg:flex'>
                     {tabsList.map((tabItem) => {
                        const tabInsightItem = insight[tabItem as keyof typeof insight];
                        const isActive = activeTab === tabItem;
                        return <li
                           key={`tab-${tabItem}`}
                           className={`${deviceTabStyle} ${isActive ? 'bg-violet-100 text-violet-700 shadow-sm' : 'hover:bg-gray-100'}`}
                           onClick={() => switchTab(tabItem)}>
                           <i className='hidden not-italic lg:inline-block capitalize'>{t(`insight.${tabItem}`)}</i>
                           {tabItem !== 'stats' && (
                              <span className={`${deviceTabCountStyle}`}>
                                 {tabInsightItem && tabInsightItem.length ? tabInsightItem.length : 0}
                              </span>
                           )}
                        </li>;
                     })}
                  </ul>

                  {/* Export Button */}
                  {activeTab !== 'stats' && filteredItems.length > 0 && (
                     <button
                        onClick={exportToCSV}
                        className='ml-auto lg:ml-4 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2'
                     >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                           <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                        </svg>
                        {t('insight.exportCSV')}
                     </button>
                  )}

                  <div className='insight_selector lg:hidden'>
                     <SelectField
                        options={tabsList.map((d) => { return { label: t(`insight.${d}`), value: d }; })}
                        selected={[activeTab]}
                        defaultLabel={t('insight.selectTab')}
                        updateField={(updatedTab: [string]) => switchTab(updatedTab[0])}
                        multiple={false}
                        rounded={'rounded'}
                     />
                  </div>
               </div>

               <div className='py-2 text-xs text-center mt-2 lg:text-sm lg:mt-0 flex flex-col lg:flex-row items-center gap-3'>
                  {/* Date Range Display */}
                  <div>
                     {startDate && new Intl.DateTimeFormat(locale || 'en-US', { dateStyle: 'medium' }).format(new Date(startDate))}
                     <span className='px-2 inline-block'>-</span>
                     {endDate && new Intl.DateTimeFormat(locale || 'en-US', { dateStyle: 'medium' }).format(new Date(endDate))}
                  </div>

                  {/* Time Range Filter */}
                  {setDaysFilter && (
                     <div className='flex gap-2 text-xs'>
                        {[
                           { label: t('periods.last7Days'), days: 7 },
                           { label: t('periods.last30Days'), days: 30 },
                           { label: t('periods.last90Days'), days: 90 },
                        ].map(({ label, days }) => (
                           <button
                              key={days}
                              onClick={() => { setDaysFilter(days); setCurrentPage(1); }}
                              className={`px-3 py-1 rounded-full transition-all ${daysFilter === days
                                 ? 'bg-violet-600 text-white shadow-sm'
                                 : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                 }`}
                           >
                              {label}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            {/* Search Bar */}
            {activeTab !== 'stats' && (
               <div className='px-6 py-3 border-b border-gray-200'>
                  <div className='relative'>
                     <input
                        type='text'
                        placeholder={`${t('common.search')} ${t(`insight.${activeTab}`)}...`}
                        value={searchQuery}
                        onChange={(e) => {
                           setSearchQuery(e.target.value);
                           setCurrentPage(1);
                        }}
                        className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent'
                     />
                     <svg className='absolute left-3 top-2.5 w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                     </svg>
                  </div>
               </div>
            )}

            {activeTab === 'stats' && (
               loading && chart.length === 0 ? (
                  <div className="px-6 py-8">
                     {/* KPI cards skeleton */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {Array(3).fill(0).map((_, i) => (
                           <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-5 animate-pulse">
                              <div className="h-3 w-20 bg-gray-200 rounded mb-3"></div>
                              <div className="h-8 w-24 bg-gray-300 rounded mb-2"></div>
                              <div className="h-2 w-16 bg-gray-200 rounded"></div>
                           </div>
                        ))}
                     </div>
                     {/* Chart skeleton */}
                     <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 animate-pulse">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
                        <div className="h-48 bg-gray-100 rounded flex items-end gap-1 p-3">
                           {Array(20).fill(0).map((_, i) => (
                              <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }}></div>
                           ))}
                        </div>
                     </div>
                     <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('insight.syncingBing')}
                     </div>
                  </div>
               ) : (
                  <InsightStats
                     stats={chart}
                     totalKeywords={keywords.length}
                     totalCountries={0}
                     totalPages={0}
                  />
               )
            )}

            {/* Top Performers */}
            {activeTab !== 'stats' && topPerformers.length > 0 && !searchQuery && (
               <div className='px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-200'>
                  <h3 className='text-sm font-semibold text-violet-700 mb-3 flex items-center'>
                     <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                     </svg>
                     {t('insight.topPerformers')}
                  </h3>
                  <div className='flex gap-2 overflow-x-auto pb-2'>
                     {topPerformers.map((item: SCInsightItem, idx: number) => (
                        <div key={idx} className='flex-shrink-0 bg-white border border-violet-200 rounded-lg px-3 py-2 min-w-[200px]'>
                           <div className='text-xs font-semibold text-gray-800 truncate mb-1'>
                              {item.keyword || item.page || item.country}
                           </div>
                           <div className='flex items-center justify-between text-xs'>
                              <span className='text-violet-600 font-bold'>{item.clicks} {t('insight.visits').toLowerCase()}</span>
                              <span className='text-gray-500'>Pos: {Math.round(item.position)}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div className='domkeywordsTable domkeywordsTable--sckeywords styled-scrollbar w-full overflow-auto min-h-[60vh]'>
               <div className=' lg:min-w-[800px]'>
                  {renderTableHeader()}
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {['keywords', 'stats'].includes(activeTab) && insight && filteredItems
                        && filteredItems.map(
                           (item: SCInsightItem, index: number) => {
                              const lastItem = !!(filteredItems && (index === filteredItems.length - 1));
                              return <InsightItem key={index} item={item} type={activeTab} lastItem={lastItem} domain={domain?.domain || ''} />;
                           },
                        )
                     }
                     {loading && (
                        Array(10).fill(0).map((_, i) => (
                           <div key={i} className='keyword relative py-5 px-4 lg:py-4 lg:px-6 lg:border-0 lg:flex lg:justify-between lg:items-center border-b border-gray-100 animate-pulse'>
                              <div className='w-1/2 lg:flex-1 h-5 bg-gray-200 rounded'></div>
                              <div className='hidden lg:block lg:flex-1 lg:basis-20 mx-4 h-5 bg-gray-200 rounded'></div>
                              <div className='hidden lg:block lg:flex-1 h-5 bg-gray-200 rounded mx-4'></div>
                              <div className='hidden lg:block lg:flex-1 h-5 bg-gray-200 rounded mx-4'></div>
                              <div className='hidden lg:block lg:flex-1 h-5 bg-gray-200 rounded'></div>
                           </div>
                        ))
                     )}
                     {searchQuery && filteredItems.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                           <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                           <p>{t('insight.noResults', { query: searchQuery })}</p>
                        </div>
                     )}
                     {!loading && !searchQuery && filteredItems.length === 0 && activeTab !== 'stats' && isBingConnected && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                           <p>{t('insight.noKeywordsData')}</p>
                        </div>
                     )}
                     {!isBingConnected && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-500" viewBox="0 0 35 50" fill="currentColor">
                                 <path d="M35 24.25l-22.177-7.761 4.338 10.82 6.923 3.225H35V24.25z" opacity=".7"/>
                                 <path d="M10 38.642V3.5L0 0v44.4L10 50l25-14.382V24.25z"/>
                              </svg>
                           </div>
                           <p className="text-lg font-medium text-gray-900">{t('insight.bingConnectTitle')}</p>
                           <p className="text-sm mt-2 mb-6 text-gray-500">{t('insight.bingConnectDesc')}</p>
                           <Link
                              href="/profile/search-console"
                              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center"
                           >
                              {t('insight.bingConnectBtn')}
                           </Link>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
               <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
                  <div className='text-sm text-gray-600'>
                     {t('insight.pageInfo', { current: currentPage, total: totalPages })}
                  </div>
                  <div className='flex gap-2'>
                     <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className='px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                     >
                        {t('insight.previous')}
                     </button>
                     <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className='px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                     >
                        {t('insight.next')}
                     </button>
                  </div>
               </div>
            )}
         </div>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default BingInsight;
