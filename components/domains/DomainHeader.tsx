import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import { useRefreshKeywords } from '../../services/keywords';
import Icon from '../common/Icon';
import SelectField from '../common/SelectField';

type DomainHeaderProps = {
   domain: DomainType,
   domains: DomainType[],
   showAddModal: Function,
   showSettingsModal: Function,
   exportCsv: Function,
   scFilter?: string
   setScFilter?: Function
   showIdeaUpdateModal?: Function
   onDeleteDomain?: Function
   onRefreshCompetitors?: Function
   isRefreshingCompetitors?: boolean
}

const DomainHeader = (
   { domain, showAddModal, showSettingsModal, exportCsv, domains, scFilter = 'thirtyDays', setScFilter, showIdeaUpdateModal, onDeleteDomain, onRefreshCompetitors, isRefreshingCompetitors = false }: DomainHeaderProps,
) => {
   const router = useRouter();
   const [showOptions, setShowOptions] = useState<boolean>(false);
   const [ShowSCDates, setShowSCDates] = useState<boolean>(false);
   const { mutate: refreshMutate } = useRefreshKeywords(() => { });
   const isConsole = router.pathname === '/domain/console/[slug]';
   const isInsight = router.pathname === '/domain/insight/[slug]';
   const isIdeas = router.pathname === '/domain/ideas/[slug]';
   const isCompetitors = router.pathname === '/domain/[slug]/competitors';

   const daysName = (dayKey: string) => dayKey.replace('three', '3').replace('seven', '7').replace('thirty', '30').replace('Days', ' Days');
   const buttonStyle = 'leading-6 inline-block px-2 py-2 text-gray-500 hover:text-gray-700';
   const buttonLabelStyle = 'ml-2 text-sm not-italic lg:invisible lg:opacity-0';
   const tabStyle = 'rounded rounded-b-none cursor-pointer border-[#e9ebff] border-b-0';
   const scDataFilterStlye = 'px-3 py-2 block w-full';
   return (
      <div className='domain_kewywords_head w-full '>
         <div className='flex w-full justify-between'>

            <div className={'flex mb-0 lg:mb-1 lg:mt-3'}>
               {!isInsight && <button className={`${buttonStyle} lg:hidden`} onClick={() => setShowOptions(!showOptions)}>
                  <Icon type='dots' size={20} />
               </button>
               }
               {isInsight && <button className={`${buttonStyle} lg:hidden invisible`}>x</button>}
               <div
                  className={`hidden w-40 ml-[-70px] lg:block absolute mt-10 bg-white border border-gray-100 z-40 rounded 
            lg:z-auto lg:relative lg:mt-0 lg:border-0 lg:w-auto lg:bg-transparent`}
                  style={{ display: showOptions ? 'block' : undefined }}>
                  {!isInsight && !isCompetitors && (
                     <button
                        className={`domheader_action_button relative ${buttonStyle}`}
                        aria-pressed="false"
                        onClick={() => exportCsv()}>
                        <Icon type='download' size={20} /><i className={`${buttonLabelStyle}`}>Export as csv</i>
                     </button>
                  )}
                  {!isConsole && !isInsight && !isIdeas && !isCompetitors && (
                     <button
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
                        aria-pressed="false"
                        onClick={() => refreshMutate({ ids: [], domain: domain.domain })}>
                        <Icon type='reload' size={14} /><i className={`${buttonLabelStyle}`}>Reload All Serps</i>
                     </button>
                  )}
                  {isCompetitors && (
                     <button
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3 ${isRefreshingCompetitors ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-pressed="false"
                        disabled={isRefreshingCompetitors}
                        onClick={() => onRefreshCompetitors && onRefreshCompetitors()}>
                        <Icon type='reload' size={14} classes={isRefreshingCompetitors ? 'animate-spin' : ''} />
                        <i className={`${buttonLabelStyle}`}>{isRefreshingCompetitors ? 'Updating...' : 'Reload Competitors'}</i>
                     </button>
                  )}
                  {!isCompetitors && !isConsole && (
                     <button
                        data-testid="show_domain_settings"
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3`}
                        aria-pressed="false"
                        onClick={() => showSettingsModal(true)}><Icon type='settings' size={20} />
                        <i className={`${buttonLabelStyle}`}>Domain Settings</i>
                     </button>
                  )}
                  {onDeleteDomain && (
                     <button
                        data-testid="delete_domain"
                        className={`domheader_action_button relative ${buttonStyle} lg:ml-3 text-red-600 hover:text-red-700`}
                        aria-pressed="false"
                        onClick={() => onDeleteDomain()}><Icon type='trash' size={20} />
                        <i className={`${buttonLabelStyle}`}>Delete Domain</i>
                     </button>
                  )}
               </div>
               {!isConsole && !isInsight && !isIdeas && !isCompetitors && (
                  <button
                     data-testid="add_keyword"
                     className={'ml-2 inline-block text-blue-700 font-bold text-sm lg:px-4 lg:py-2'}
                     onClick={() => showAddModal(true)}>
                     <span
                        className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>+</span>
                     <i className=' not-italic hidden lg:inline-block'>Add Keyword</i>
                  </button>
               )}

               {isIdeas && (
                  <button
                     data-testid="load_ideas"
                     className={'ml-2 text-blue-700 font-bold text-sm flex items-center lg:px-4 lg:py-2'}
                     onClick={() => showIdeaUpdateModal && showIdeaUpdateModal()}>
                     <span
                        className='text-center leading-4 mr-2 inline-block rounded-full w-7 h-7 pt-1 bg-blue-700 text-white font-bold text-lg'>
                        <Icon type='reload' size={12} />
                     </span>
                     <i className=' not-italic hidden lg:inline-block'>Load Ideas</i>
                  </button>
               )}
            </div>

            {isConsole && (
               <div className='flex items-center lg:mt-3'>
                  <div className="relative">
                     <span className='block cursor-pointer py-2 px-3 bg-white border border-gray-200 rounded-md hover:border-blue-400 transition-colors text-xs font-medium text-gray-700 shadow-sm flex items-center' onClick={() => setShowSCDates(!ShowSCDates)}>
                        <Icon type='date' size={14} classes="mr-2 text-gray-500" />
                        Last {daysName(scFilter).trim()}
                     </span>
                     {ShowSCDates && (
                        <div className='absolute w-40 z-50 mt-1 top-full right-0 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100'>
                           {['threeDays', 'sevenDays', 'thirtyDays'].map((itemKey) => {
                              return <button
                                 key={itemKey}
                                 className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50 ${scFilter === itemKey ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                                 onClick={() => { setShowSCDates(false); if (setScFilter) setScFilter(itemKey); }}
                              >Last {daysName(itemKey)}
                              </button>;
                           })}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default DomainHeader;
