import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useRefreshKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';

type DomainHeaderProps = {
   domain: DomainType,
   domains: DomainType[],
   showAddModal?: Function,

   exportCsv: Function,
   scFilter?: string
   setScFilter?: Function
   showIdeaUpdateModal?: Function
   onDeleteDomain?: Function
   onRefreshCompetitors?: Function
   isRefreshingCompetitors?: boolean
}

const DomainHeader = (
   { domain, showAddModal, exportCsv, domains, scFilter = 'thirtyDays', setScFilter, showIdeaUpdateModal, onDeleteDomain, onRefreshCompetitors, isRefreshingCompetitors = false }: DomainHeaderProps,
) => {
   const router = useRouter();
   const [showOptions, setShowOptions] = useState<boolean>(false);
   const [ShowSCDates, setShowSCDates] = useState<boolean>(false);
   const { mutate: refreshMutate } = useRefreshKeywords(() => { });
   const isConsole = router.pathname === '/domain/console/[slug]';
   const isInsight = router.pathname === '/domain/insight/[slug]';
   const isIdeas = router.pathname === '/domain/ideas/[slug]';
   const isCompetitors = router.pathname === '/domain/[slug]/competitors' || router.pathname === '/tracking/[slug]/competitors';
   const isTracking = router.pathname === '/tracking/[slug]';

   const daysName = (dayKey: string) => dayKey.replace('three', '3').replace('seven', '7').replace('thirty', '30').replace('Days', ' Days');
   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';

   return (
      <div className='domain_kewywords_head w-full '>
         <div className='flex w-full justify-between items-center'>

            {/* Left Side: Mobile Menu Trigger */}
            <div className={'flex mb-0 lg:mb-1 lg:mt-3 relative'}>
               {!isInsight && (
                  <button className={`${buttonStyle} lg:hidden`} onClick={() => setShowOptions(!showOptions)}>
                     <Icon type='dots' size={20} />
                  </button>
               )}
               {isInsight && <button className={`${buttonStyle} lg:hidden invisible`}>x</button>}

               {/* Mobile Dropdown Menu */}
               <div
                  className={`lg:hidden absolute top-10 left-0 bg-white border border-gray-100 z-50 rounded shadow-lg flex flex-col min-w-[200px]`}
                  style={{ display: showOptions ? 'flex' : 'none' }}>

                  {!isConsole && !isInsight && !isIdeas && !isCompetitors && !isTracking && (
                     <button
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full text-left border-b border-gray-50 last:border-0"
                        onClick={() => { setShowOptions(false); refreshMutate({ ids: [], domain: domain.domain }); }}>
                        <Icon type='reload' size={16} /> Reload Serps
                     </button>
                  )}

                  {onDeleteDomain && (
                     <button
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-red-600 w-full text-left"
                        onClick={() => { setShowOptions(false); onDeleteDomain(); }}>
                        <Icon type='trash' size={16} /> Delete Domain
                     </button>
                  )}
               </div>
            </div>

            {/* Right Side: All Actions & Filters */}
            <div className='flex items-center gap-3 lg:mt-3'>

               {/* Desktop Icon Buttons */}
               <div className="hidden lg:flex items-center gap-1">

                  {!isConsole && !isInsight && !isIdeas && !isCompetitors && !isTracking && (
                     <button
                        className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors`}
                        title="Reload All Serps"
                        onClick={() => refreshMutate({ ids: [], domain: domain.domain })}>
                        <Icon type='reload' size={18} />
                     </button>
                  )}
                  {isCompetitors && (
                     <button
                        className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors ${isRefreshingCompetitors ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isRefreshingCompetitors}
                        onClick={() => onRefreshCompetitors && onRefreshCompetitors()}>
                        <Icon type='reload' size={14} classes={isRefreshingCompetitors ? 'animate-spin' : ''} />
                        {isRefreshingCompetitors ? 'Updating...' : 'Reload'}
                     </button>
                  )}

                  {onDeleteDomain && (
                     <button
                        className={`p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors`}
                        title="Delete Domain"
                        onClick={() => onDeleteDomain()}>
                        <Icon type='trash' size={20} />
                     </button>
                  )}
               </div>

               {/* Primary Actions (Add Keyword / Load Ideas) */}
               {!isConsole && !isInsight && !isIdeas && !isCompetitors && !isTracking && (
                  <button
                     data-testid="add_keyword"
                     className={'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold'}
                     onClick={() => showAddModal && showAddModal(true)}>
                     <span>+</span>
                     <span className="hidden sm:inline">Add Keyword</span>
                  </button>
               )}

               {isIdeas && (
                  <button
                     data-testid="load_ideas"
                     className={'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-semibold'}
                     onClick={() => showIdeaUpdateModal && showIdeaUpdateModal()}>
                     <Icon type='reload' size={14} />
                     <span className="hidden sm:inline">Load Ideas</span>
                  </button>
               )}

               {/* Console Date Filter - Pill Buttons Style */}
               {isConsole && (
                  <div className="flex items-center gap-2 ml-2">
                     {[
                        { label: '3 Days', value: 'threeDays' },
                        { label: '7 Days', value: 'sevenDays' },
                        { label: '30 Days', value: 'thirtyDays' }
                     ].map((item) => (
                        <button
                           key={item.value}
                           onClick={() => setScFilter && setScFilter(item.value)}
                           className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${scFilter === item.value
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                        >
                           Last {item.label}
                        </button>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default DomainHeader;
