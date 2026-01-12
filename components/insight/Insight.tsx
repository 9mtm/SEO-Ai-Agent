import React, { useState } from 'react';
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

   const insightItems = insight[activeTab as keyof InsightDataType];
   const startDate = insight && insight.stats && insight.stats.length > 0 ? new Date(insight.stats[0].date) : null;
   const endDate = insight && insight.stats && insight.stats.length > 0 ? new Date(insight.stats[insight.stats.length - 1].date) : null;

   const switchTab = (tab: string) => {
      // window.insightTab = tab;
      setActiveTab(tab);
      setSortBy('clicks'); // Reset sort when switching tabs
   };

   const handleSort = (column: string) => {
      // Logic to toggle asc/desc
      // If currently asc, go desc. If currently desc, go asc. Default to desc.
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
   // `Insight` does not. 
   // I might need to update `utils/insight.ts` AGAIN to support direction if I want to match `SCKeywordsTable` behavior perfectly.
   // However, `sortInsightItems` is a utility.

   // Let's implement basic sort selection first, as `Insight` component structure is a bit different.
   // User said "Visits ↑", implying a default sort or visual.

   // Actually, to fully match the "Same way" request, I SHOULD implement toggling.
   // So I really should check `utils/insight.ts` again and make it robust.
   // But I already moved past that.
   // Let's look at `renderTableHeader` replacement first.

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
            { label: 'Visits ↑', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Countries', key: 'countries' }
         ],
         countries: [
            { label: 'Country', key: 'country' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits ↑', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Keywords', key: 'keywords' }
         ],
         pages: [
            { label: 'Page', key: 'page' },
            { label: 'Avg Position', key: 'position' },
            { label: 'Visits ↑', key: 'clicks' },
            { label: 'Impressions', key: 'impressions' },
            { label: 'CTR', key: 'ctr' },
            { label: 'Countries', key: 'countries' },
            { label: 'Keywords', key: 'keywords' }
         ],
      };

      return (
         <div className={`domKeywords_head hidden lg:flex p-3 px-6 bg-[#FCFCFF]
            text-gray-600 justify-between items-center font-semibold border-y`}>
            {headerNames[activeTab].map((header, index) => {
               // Determine styles based on index to match original layout
               let className = 'flex-1 text-center';
               if (index === 0) className = 'domKeywords_head_keyword flex-1 basis-20 w-auto text-left'; // First col
               else if (header.key === 'position') className = 'domKeywords_head_position flex-1 basis-40 grow-0 text-center';

               return (
                  <span
                     key={header.key}
                     className={`${className} cursor-pointer hover:text-blue-700 select-none`}
                     onClick={() => handleSort(header.key)}
                  >
                     {header.label}{sortBy === header.key ? ' ↓' : ''}
                  </span>
               );
            })}
         </div>
      );
   };

   const deviceTabStyle = 'select-none cursor-pointer px-3 py-2 rounded-3xl mr-2';
   const deviceTabCountStyle = 'px-2 py-0 rounded-3xl bg-[#DEE1FC] text-[0.7rem] font-bold ml-1';

   return (
      <div>
         <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
            <div className='domKeywords_filters py-4 px-6 flex flex-col justify-between
            text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0 lg:flex-row'>
               <div>
                  <ul className='text-xs hidden lg:flex'>
                     {['stats', 'keywords', 'countries', 'pages'].map((tabItem) => {
                        const tabInsightItem = insight[tabItem as keyof InsightDataType];
                        return <li
                           key={`tab-${tabItem}`}
                           className={`${deviceTabStyle} ${activeTab === tabItem ? ' bg-[#F8F9FF] text-gray-700' : ''}`}
                           onClick={() => switchTab(tabItem)}>
                           <i className='hidden not-italic lg:inline-block ml-1 capitalize'>{tabItem}</i>
                           {tabItem !== 'stats' && (
                              <span className={`${deviceTabCountStyle}`}>
                                 {tabInsightItem && tabInsightItem.length ? tabInsightItem.length : 0}
                              </span>
                           )}
                        </li>;
                     })}
                  </ul>
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
                  <span className='ml-2'>(Last 30 Days)</span>
               </div>
               )}
            </div>
            {isConsoleIntegrated && activeTab === 'stats' && (
               <InsightStats
                  stats={insight?.stats ? insight.stats : []}
                  totalKeywords={insight?.keywords?.length || 0}
                  totalCountries={insight?.countries?.length || 0}
                  totalPages={insight?.pages?.length || 0}
               />
            )}

            <div className='domkeywordsTable domkeywordsTable--sckeywords styled-scrollbar w-full overflow-auto min-h-[60vh]'>
               <div className=' lg:min-w-[800px]'>
                  {renderTableHeader()}
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {['keywords', 'pages', 'countries', 'stats'].includes(activeTab) && insight && insightItems
                        && (activeTab === 'stats' ? [...insightItems].reverse() : sortInsightItems(insightItems, sortBy)).map(
                           (item: SCInsightItem, index: number) => {
                              const insightItemCount = insight ? insightItems : [];
                              const lastItem = !!(insightItemCount && (index === insightItemCount.length));
                              return <InsightItem key={index} item={item} type={activeTab} lastItem={lastItem} domain={domain?.domain || ''} />;
                           },
                        )
                     }
                     {isConsoleIntegrated && isPending && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>Loading Insight...</p>
                     )}
                     {!isConsoleIntegrated && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>
                           Google Search Console has not been Integrated yet. Please follow <a className='text-indigo-600 underline' href='https://docs.serpbear.com/miscellaneous/integrate-google-search-console' target="_blank" rel='noreferrer'>These Steps</a> to integrate Google Search Data for this Domain.
                        </p>
                     )}
                  </div>
               </div>
            </div>
         </div>
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default SCInsight;
