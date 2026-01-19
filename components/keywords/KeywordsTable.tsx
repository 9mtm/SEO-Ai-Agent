import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { filterKeywords, keywordsByDevice, sortKeywords } from '../../utils/client/sortFilter';
import Icon from '../common/Icon';
import Keyword from './Keyword';
import KeywordDetails from './KeywordDetails';
import KeywordFilters from './KeywordFilter';
import Modal from '../common/Modal';
import { useDeleteKeywords, useFavKeywords, useRefreshKeywords } from '../../services/keywords';
import KeywordTagManager from './KeywordTagManager';
import AddTags from './AddTags';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import { useUpdateSettings } from '../../services/settings';
import { defaultSettings } from '../../pages/profile/scraper';
import TableSkeleton from '../common/TableSkeleton';
import { useLanguage } from '../../context/LanguageContext';

type KeywordsTableProps = {
   domain: DomainType | null,
   keywords: KeywordType[],
   isPending: boolean,
   showAddModal: boolean,
   setShowAddModal: Function,
   isConsoleIntegrated: boolean,
   settings?: SettingsType,
   onAddKeyword?: () => void,
   onReload?: () => void
}

const KeywordsTable = (props: KeywordsTableProps) => {
   const { t } = useLanguage();
   const titleColumnRef = useRef(null);
   const { keywords = [], isPending = true, isConsoleIntegrated = false, settings } = props;
   const showSCData = isConsoleIntegrated;
   const [device, setDevice] = useState<string>('desktop');
   const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
   const [showKeyDetails, setShowKeyDetails] = useState<KeywordType | null>(null);
   const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
   const [showTagManager, setShowTagManager] = useState<null | number>(null);
   const [showAddTags, setShowAddTags] = useState<boolean>(false);
   const [SCListHeight, setSCListHeight] = useState(500);
   const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
   const [sortBy, setSortBy] = useState<string>('date_asc');
   const [scDataType, setScDataType] = useState<string>('threeDays');
   const [showScDataTypes, setShowScDataTypes] = useState<boolean>(false);
   const [maxTitleColumnWidth, setMaxTitleColumnWidth] = useState(235);
   const { mutate: deleteMutate } = useDeleteKeywords(() => { });
   const { mutate: favoriteMutate } = useFavKeywords(() => { });
   const { mutate: refreshMutate } = useRefreshKeywords(() => { });
   const [isMobile] = useIsMobile();

   useWindowResize(() => {
      // setSCListHeight(window.innerHeight - (isMobile ? 200 : 400)); // Removed for auto-height
      if (titleColumnRef.current) {
         setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
      }
   });

   useEffect(() => {
      if (titleColumnRef.current) {
         setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
      }
   }, [titleColumnRef]);

   const tableColumns = settings?.keywordsColumns || ['Best', 'History', 'Volume', 'Search Console'];
   const { mutate: updateMutate, isPending: isUpdatingSettings } = useUpdateSettings(() => console.log(''));

   const scDataObject: { [k: string]: string } = {
      threeDays: t('domainHeader.last3Days'),
      sevenDays: t('domainHeader.last7Days'),
      thirtyDays: t('domainHeader.last30Days'),
      avgThreeDays: `${t('domainHeader.last3Days')} Avg`,
      avgSevenDays: `${t('domainHeader.last7Days')} Avg`,
      avgThirtyDays: `${t('domainHeader.last30Days')} Avg`,
   };

   const processedKeywords: { [key: string]: KeywordType[] } = useMemo(() => {
      const procKeywords = keywords.filter((x) => x.device === device);
      const filteredKeywords = filterKeywords(procKeywords, filterParams);
      const sortedKeywords = sortKeywords(filteredKeywords, sortBy, scDataType);
      return keywordsByDevice(sortedKeywords, device);
   }, [keywords, device, sortBy, filterParams, scDataType]);

   const allDomainTags: string[] = useMemo(() => {
      const allTags = keywords.reduce((acc: string[], keyword) => [...acc, ...keyword.tags], []).filter((t) => t && t.trim() !== '');
      return [...new Set(allTags)];
   }, [keywords]);

   const selectKeyword = (keywordID: number) => {
      console.log('Select Keyword: ', keywordID);
      let updatedSelectd = [...selectedKeywords, keywordID];
      if (selectedKeywords.includes(keywordID)) {
         updatedSelectd = selectedKeywords.filter((keyID) => keyID !== keywordID);
      }
      setSelectedKeywords(updatedSelectd);
   };

   const updateColumns = (column: string) => {
      const newColumns = tableColumns.includes(column) ? tableColumns.filter((col) => col !== column) : [...tableColumns, column];
      updateMutate({ ...defaultSettings, ...settings, keywordsColumns: newColumns });
   };

   const shouldHideColumn = useCallback((col: string) => {
      return settings?.keywordsColumns && !settings?.keywordsColumns.includes(col) ? 'lg:hidden' : '';
   }, [settings?.keywordsColumns]);

   const handleColumnSort = (column: string) => {
      const sortMap: { [key: string]: { asc: string, desc: string } } = {
         position: { asc: 'pos_asc', desc: 'pos_desc' },
         volume: { asc: 'vol_asc', desc: 'vol_desc' },
         impressions: { asc: 'imp_asc', desc: 'imp_desc' },
         visits: { asc: 'visits_asc', desc: 'visits_desc' },
         updated: { asc: 'date_desc', desc: 'date_asc' },
      };

      const currentSort = sortMap[column];
      if (!currentSort) return;

      // Toggle between asc and desc
      const isCurrentlyAsc = sortBy === currentSort.asc;
      setSortBy(isCurrentlyAsc ? currentSort.desc : currentSort.asc);
   };

   const getSortIcon = (column: string) => {
      const sortMap: { [key: string]: { asc: string, desc: string } } = {
         position: { asc: 'pos_asc', desc: 'pos_desc' },
         volume: { asc: 'vol_asc', desc: 'vol_desc' },
         impressions: { asc: 'imp_asc', desc: 'imp_desc' },
         visits: { asc: 'visits_asc', desc: 'visits_desc' },
         updated: { asc: 'date_desc', desc: 'date_asc' },
      };

      const currentSort = sortMap[column];
      if (!currentSort) return null;

      if (sortBy === currentSort.asc) return ' ↑';
      if (sortBy === currentSort.desc) return ' ↓';
      return null;
   };

   const Row = ({ data, index, style }: ListChildComponentProps) => {
      const keyword = data[index];
      return (
         <Keyword
            key={keyword.ID}
            style={style}
            index={index}
            selected={selectedKeywords.includes(keyword.ID)}
            selectKeyword={selectKeyword}
            keywordData={keyword}
            refreshkeyword={() => refreshMutate({ ids: [keyword.ID] })}
            favoriteKeyword={favoriteMutate}
            manageTags={() => setShowTagManager(keyword.ID)}
            removeKeyword={() => { setSelectedKeywords([keyword.ID]); setShowRemoveModal(true); }}
            showKeywordDetails={() => setShowKeyDetails(keyword)}
            lastItem={index === (processedKeywords[device].length - 1)}
            showSCData={showSCData}
            scDataType={scDataType}
            tableColumns={tableColumns}
            maxTitleColumnWidth={maxTitleColumnWidth}
         />
      );
   };

   const selectedAllItems = selectedKeywords.length === processedKeywords[device].length;

   return (
      <div>
         <div className='domKeywords flex flex-col bg-white rounded-xl text-sm border border-gray-100 mb-5 shadow-xl shadow-gray-200/40 relative'>
            {selectedKeywords.length > 0 && (
               <div className='flex items-center gap-4 py-3 px-6 bg-indigo-50/50 border-b border-indigo-100 rounded-t-xl'>
                  <span className='text-xs font-bold uppercase tracking-wider text-indigo-400'>{selectedKeywords.length} {t('trackingTable.selected')}</span>
                  <div className="h-4 w-[1px] bg-indigo-200"></div>
                  <div className='flex items-center gap-2'>
                     <button
                        className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-xs font-semibold text-indigo-600 shadow-sm hover:shadow hover:bg-indigo-50 transition-all'
                        onClick={() => { refreshMutate({ ids: selectedKeywords }); setSelectedKeywords([]); }}
                     >
                        <Icon type="reload" size={12} classes="text-indigo-500" /> {t('trackingTable.refresh')}
                     </button>
                     <button
                        className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-100 text-xs font-semibold text-green-600 shadow-sm hover:shadow hover:bg-green-50 transition-all'
                        onClick={() => setShowAddTags(true)}
                     >
                        <Icon type="tags" size={12} classes="text-green-500" /> {t('trackingTable.tag')}
                     </button>
                     <button
                        className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-red-100 text-xs font-semibold text-red-600 shadow-sm hover:shadow hover:bg-red-50 transition-all'
                        onClick={() => setShowRemoveModal(true)}
                     >
                        <Icon type="trash" size={12} classes="text-red-500" /> {t('trackingTable.remove')}
                     </button>
                  </div>
               </div>
            )}
            {selectedKeywords.length === 0 && (
               <KeywordFilters
                  allTags={allDomainTags}
                  filterParams={filterParams}
                  filterKeywords={(params: KeywordFilters) => setFilterParams(params)}
                  updateSort={(sorted: string) => setSortBy(sorted)}
                  sortBy={sortBy}
                  keywords={keywords}
                  device={device}
                  setDevice={setDevice}
                  tableColumns={tableColumns}
                  integratedConsole={isConsoleIntegrated}
                  onAddKeyword={props.onAddKeyword}
                  onReload={props.onReload}
               />
            )}
            <div className={`domkeywordsTable domkeywordsTable--keywords 
            ${showSCData && tableColumns.includes('Search Console') ? 'domkeywordsTable--hasSC' : ''} 
               w-full`}>
               <div className=' lg:min-w-[800px]'>
                  <div className={`domKeywords_head domKeywords_head--${sortBy} hidden lg:flex p-3 px-6 bg-white/95 backdrop-blur-md sticky top-0 z-30
                   text-gray-500 justify-between items-center font-bold text-xs uppercase tracking-wider border-y border-gray-100 shadow-sm`}>
                     <span ref={titleColumnRef} className={`domKeywords_head_keyword flex-1 basis-[4rem] w-auto lg:flex-1 
                        ${showSCData && tableColumns.includes('Search Console') ? 'lg:basis-20' : 'lg:basis-10'} lg:w-auto lg:flex lg:items-center `}>
                        {processedKeywords[device].length > 0 && (
                           <button
                              className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px]  border border-slate-300 
                           ${selectedAllItems ? ' bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                              onClick={() => setSelectedKeywords(selectedAllItems ? [] : processedKeywords[device].map((k: KeywordType) => k.ID))}
                           >
                              <Icon type="check" size={10} />
                           </button>
                        )}
                        {/* ${showSCData ? 'lg:min-w-[220px]' : 'lg:min-w-[280px]'} */}
                        <span className={`inline-block lg:flex lg:items-center 
                           ${showSCData && tableColumns.includes('Search Console') ? 'lg:max-w-[235px]' : ''}`}>
                           {t('trackingTable.keyword')}
                        </span>
                     </span>
                     <span
                        className='domKeywords_head_position flex-1 basis-32 grow-0 text-center cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('position')}
                     >
                        Position{getSortIcon('position')}
                     </span>
                     <span className={`domKeywords_head_best flex-1 basis-32 grow-0 text-center  ${shouldHideColumn('Best')}`}>{t('trackingTable.best')}</span>
                     <span className={`domKeywords_head_history flex-1 basis-32 grow-0  ${shouldHideColumn('History')}`}>{t('trackingTable.history')}</span>
                     <span
                        className={`domKeywords_head_volume flex-1 basis-32 grow-0 text-center cursor-pointer 
                           hover:text-blue-700 select-none ${shouldHideColumn('Volume')}`}
                        onClick={() => handleColumnSort('volume')}
                     >
                        {t('trackingTable.volume')}{getSortIcon('volume')}
                     </span>
                     <span className='domKeywords_head_url flex-1'>{t('trackingTable.url')}</span>
                     <span className='domKeywords_head_tags flex-1 basis-32 grow-0 text-center'>{t('trackingTable.tags')}</span>
                     <span
                        className='domKeywords_head_updated flex-1 relative left-3 max-w-[150px] cursor-pointer hover:text-blue-700 select-none'
                        onClick={() => handleColumnSort('updated')}
                     >
                        {t('trackingTable.updated')}{getSortIcon('updated')}
                     </span>
                     {showSCData && tableColumns.includes('Search Console') && (
                        <div className='domKeywords_head_sc flex-1 min-w-[170px] lg:max-w-[170px] mr-7 text-center'>
                           {/* Search Console */}
                           <div>
                              <div
                                 className='w-48 select-none cursor-pointer absolute bg-white/90 backdrop-blur rounded-full shadow-sm
                              px-3 py-1 mt-[-22px] ml-3 border border-gray-200 hover:border-indigo-300 transition-colors z-20 flex items-center gap-2 text-[11px] font-medium text-gray-600'
                                 onClick={() => setShowScDataTypes(!showScDataTypes)}>
                                 <Icon type="google" size={13} /> {scDataObject[scDataType]}
                                 <Icon classes="ml-2" type={showScDataTypes ? 'caret-up' : 'caret-down'} size={10} />
                              </div>
                              {showScDataTypes && (
                                 <div className='absolute bg-white border border-gray-200 z-50 w-44 rounded mt-2 ml-5 text-gray-500'>
                                    {Object.keys(scDataObject).map((itemKey) => {
                                       return <span
                                          className={`block p-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-600
                                                 ${scDataType === itemKey ? 'bg-indigo-100 text-indigo-600' : ''}`}
                                          key={itemKey}
                                          onClick={() => { setScDataType(itemKey); setShowScDataTypes(false); }}>
                                          {scDataObject[itemKey]}
                                       </span>;
                                    })}
                                 </div>
                              )}
                           </div>
                           <div className='relative top-2 flex justify-between'>
                              <span
                                 className='min-w-[40px] cursor-pointer hover:text-blue-700 select-none'
                                 onClick={() => handleColumnSort('impressions')}
                              >
                                 {t('trackingTable.scPos')}{getSortIcon('impressions')}
                              </span>
                              <span
                                 className='min-w-[40px] cursor-pointer hover:text-blue-700 select-none'
                                 onClick={() => handleColumnSort('impressions')}
                              >
                                 {t('trackingTable.scImp')}{getSortIcon('impressions')}
                              </span>
                              <span
                                 className='min-w-[40px] cursor-pointer hover:text-blue-700 select-none'
                                 onClick={() => handleColumnSort('visits')}
                              >
                                 {t('trackingTable.scVisits')}{getSortIcon('visits')}
                              </span>
                              {/* <span>CTR</span> */}
                           </div>
                        </div>
                     )}
                  </div>
                  <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                     {processedKeywords[device] && processedKeywords[device].length > 0 && (
                        <List
                           innerElementType="div"
                           itemData={processedKeywords[device]}
                           itemCount={processedKeywords[device].length}
                           itemSize={isMobile ? 146 : 57}
                           height={Math.max(processedKeywords[device].length * (isMobile ? 146 : 57), 400)}
                           width={'100%'}
                           className={'styled-scrollbar'}
                        >
                           {Row}
                        </List>
                     )}
                     {!isPending && processedKeywords[device].length === 0 && (
                        <p className=' p-9 pt-[10%] text-center text-gray-500'>{t('trackingTable.noKeywordsDevice')}</p>
                     )}
                     {isPending && (
                        <TableSkeleton rows={8} />
                     )}
                  </div>
               </div>
            </div>
         </div>
         {showKeyDetails && showKeyDetails.ID && (
            <KeywordDetails keyword={showKeyDetails} closeDetails={() => setShowKeyDetails(null)} />
         )}
         {showRemoveModal && selectedKeywords.length > 0 && (
            <Modal closeModal={() => { setSelectedKeywords([]); setShowRemoveModal(false); }} title={t('trackingTable.removeTitle')}>
               <div className='text-sm'>
                  <p>{t('trackingTable.removeConfirm', { count: selectedKeywords.length > 1 ? selectedKeywords.length : '' })}</p>
                  <div className='mt-6 text-right font-semibold'>
                     <button
                        className=' py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                        onClick={() => { setSelectedKeywords([]); setShowRemoveModal(false); }}>
                        {t('common.cancel')}
                     </button>
                     <button
                        className=' py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                        onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); setSelectedKeywords([]); }}>
                        {t('common.delete')}
                     </button>
                  </div>
               </div>
            </Modal>
         )}
         {showTagManager && (
            <KeywordTagManager
               allTags={allDomainTags}
               keyword={keywords.find((k) => k.ID === showTagManager)}
               closeModal={() => setShowTagManager(null)}
            />
         )}
         {showAddTags && (
            <AddTags
               existingTags={allDomainTags}
               keywords={keywords.filter((k) => selectedKeywords.includes(k.ID))}
               closeModal={() => setShowAddTags(false)}
            />
         )}
         <Toaster position='bottom-center' containerClassName="react_toaster" />
      </div>
   );
};

export default KeywordsTable;
