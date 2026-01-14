import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { sortInsightItems } from '../../utils/insight';
import SelectField from '../common/SelectField';
import InsightItem from './InsightItem';
import InsightStats from './InsightStats';

type SCInsightProps = {
   domain: DomainType | null,
   insight: InsightDataType,
   isPending: boolean,
   isConsoleIntegrated: boolean,
}

const SCInsight = ({ insight, isPending = true, isConsoleIntegrated = true, domain }: SCInsightProps) => {
   const [activeTab, setActiveTab] = useState<string>('stats');
   const [sortBy, setSortBy] = useState<string>('clicks');
   const [searchQuery, setSearchQuery] = useState<string>('');
   const [currentPage, setCurrentPage] = useState<number>(1);
   const itemsPerPage = 20;

   const insightItems = insight[activeTab as keyof InsightDataType];
   const startDate = insight && insight.stats && insight.stats.length > 0 ? new Date(insight.stats[0].date) : null;
   const endDate = insight && insight.stats && insight.stats.length > 0 ? new Date(insight.stats[insight.stats.length - 1].date) : null;

   const switchTab = (tab: string) => {
      setActiveTab(tab);
      setSortBy('clicks');
      setSearchQuery('');
      setCurrentPage(1);
   };

   const handleSort = (column: string) => {
      const isAsc = sortBy === `${column}_asc`;
      const isDesc = sortBy === `${column}_desc`;

      if (isDesc) {
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
         items = items.filter((item: SCInsightItem) => {
            const searchText = (item.keyword || item.page || item.country || '').toLowerCase();
            return searchText.includes(searchQuery.toLowerCase());
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
            { label: 'Date', key: 'date' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' }
         ],
         keywords: [
            { label: 'Keyword', key: 'keyword' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Countries', key: 'countries' }
         ],
         countries: [
            { label: 'Country', key: 'country' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Keywords', key: 'keywords' }
         ],
         pages: [
            { label: 'Page', key: 'page' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Countries', key: 'countries' },
            { label: 'Keywords', key: 'keywords' }
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
         ? ['Keyword', 'Position', 'Clicks', 'Impressions', 'CTR', 'Countries']
         : activeTab === 'pages'
            ? ['Page', 'Position', 'Clicks', 'Impressions', 'CTR', 'Countries', 'Keywords']
            : activeTab === 'countries'
               ? ['Country', 'Position', 'Clicks', 'Impressions', 'CTR', 'Keywords']
               : ['Date', 'Position', 'Clicks', 'Impressions', 'CTR'];

      const rows = filteredItems.map((item: SCInsightItem) => {
         if (activeTab === 'keywords') {
            return [item.keyword, item.position, item.clicks, item.impressions, item.ctr, item.countries];
         } else if (activeTab === 'pages') {
            return [item.page, item.position, item.clicks, item.impressions, item.ctr, item.countries, item.keywords];
         } else if (activeTab === 'countries') {
            return [item.country, item.position, item.clicks, item.impressions, item.ctr, item.keywords];
         } else {
            return [item.date, item.position, item.clicks, item.impressions, item.ctr];
         }
      });

      const csvContent = [
         headers.join(','),
         ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-${domain?.domain || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
   };

   const deviceTabStyle = 'select-none cursor-pointer px-4 py-2.5 rounded-lg mr-2 transition-all duration-200 font-medium';
   const deviceTabCountStyle = 'px-2 py-0.5 rounded-full bg-violet-100 text-[0.7rem] font-bold ml-2 text-violet-700';

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5 shadow-sm'>
            <div className='domKeywords_filters py-4 px-6 flex flex-col justify-between
            text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0 lg:flex-row'>
               <div className='flex items-center justify-between w-full lg:w-auto'>
                  <ul className='text-xs hidden lg:flex'>
                     {['stats', 'keywords', 'countries', 'pages'].map((tabItem) => {
                        const tabInsightItem = insight[tabItem as keyof InsightDataType];
                        const isActive = activeTab === tabItem;
                        return <li
                           key={`tab-${tabItem}`}
                           className={`${deviceTabStyle} ${isActive ? 'bg-violet-100 text-violet-700 shadow-sm' : 'hover:bg-gray-100'}`}
                           onClick={() => switchTab(tabItem)}>
                           <i className='hidden not-italic lg:inline-block capitalize'>{tabItem}</i>
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
                        Export CSV
                     </button>
                  )}

                  <div className='insight_selector lg:hidden'>
                     <SelectField
                        options={['stats', 'keywords', 'countries', 'pages'].map((d) => { return { label: d, value: d }; })}
                        selected={[activeTab]}
                        defaultLabel="Select Tab"
                        updateField={(updatedTab: [string]) => switchTab(updatedTab[0])}
                        multiple={false}
                        rounded={'rounded'}
                     />
                  </div>
               </div>
               {isConsoleIntegrated && (<div className='py-2 text-xs text-center mt-2 lg:text-sm lg:mt-0'>
                  {startDate && new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(startDate))}
                  <span className='px-2 inline-block'>-</span>
                  {endDate && new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(endDate))}
                  <span className='ml-2 text-gray-400'>(Last 30 Days)</span>
               </div>
               )}
            </div>

            {/* Search Bar */}
            {activeTab !== 'stats' && (
               <div className='px-6 py-3 border-b border-gray-200'>
                  <div className='relative'>
                     <input
                        type='text'
                        placeholder={`Search ${activeTab}...`}
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

            {isConsoleIntegrated && activeTab === 'stats' && (
               <InsightStats
                  stats={insight?.stats ? insight.stats : []}
                  totalKeywords={insight?.keywords?.length || 0}
                  totalCountries={insight?.countries?.length || 0}
                  totalPages={insight?.pages?.length || 0}
               />
            )}

            {/* Top Performers */}
            {activeTab !== 'stats' && topPerformers.length > 0 && !searchQuery && (
               <div className='px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-200'>
                  <h3 className='text-sm font-semibold text-violet-700 mb-3 flex items-center'>
                     <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                     </svg>
                     Top 5 Performers
                  </h3>
                  <div className='flex gap-2 overflow-x-auto pb-2'>
                     {topPerformers.map((item: SCInsightItem, idx: number) => (
                        <div key={idx} className='flex-shrink-0 bg-white border border-violet-200 rounded-lg px-3 py-2 min-w-[200px]'>
                           <div className='text-xs font-semibold text-gray-800 truncate mb-1'>
                              {item.keyword || item.page || item.country}
                           </div>
                           <div className='flex items-center justify-between text-xs'>
                              <span className='text-violet-600 font-bold'>{item.clicks} visits</span>
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
                     {['keywords', 'pages', 'countries', 'stats'].includes(activeTab) && insight && filteredItems
                        && filteredItems.map(
                           (item: SCInsightItem, index: number) => {
                              const lastItem = !!(filteredItems && (index === filteredItems.length - 1));
                              return <InsightItem key={index} item={item} type={activeTab} lastItem={lastItem} domain={domain?.domain || ''} />;
                           },
                        )
                     }
                     {isConsoleIntegrated && isPending && (
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
                     {!isConsoleIntegrated && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-1.07 3.97-2.9 5.4z" />
                              </svg>
                           </div>
                           <p className="text-lg font-medium text-gray-900">Google Search Console Not Integrated</p>
                           <p className="text-sm mt-2 mb-6 text-gray-500">Connect your account in Settings to see insights.</p>

                           <Link
                              href="/settings?tab=search_console"
                              className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center"
                           >
                              Connect Google Search Console
                           </Link>
                        </div>
                     )}
                     {searchQuery && filteredItems.length === 0 && !isPending && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                           <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                           </svg>
                           <p>No results found for "{searchQuery}"</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
               <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
                  <div className='text-sm text-gray-600'>
                     Page {currentPage} of {totalPages}
                  </div>
                  <div className='flex gap-2'>
                     <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className='px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                     >
                        Previous
                     </button>
                     <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className='px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                     >
                        Next
                     </button>
                  </div>
               </div>
            )}
         </div>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default SCInsight;
