import React, { useState, useMemo } from 'react';
import Icon from '../common/Icon';
import SelectField, { SelectionOption } from '../common/SelectField';
import countries from '../../utils/countries';
import { useLanguage } from '../../context/LanguageContext';

type KeywordFilterProps = {
   device: string,
   allTags: string[],
   setDevice: Function,
   filterParams: KeywordFilters,
   filterKeywords: Function,
   keywords: KeywordType[] | SearchAnalyticsItem[],
   updateSort: Function,
   sortBy: string,
   integratedConsole?: boolean,
   isConsole?: boolean,
   SCcountries?: string[];
   updateColumns?: Function,
   tableColumns?: string[],
   onAddKeyword?: () => void,
   onReload?: () => void
}

const KeywordFilters = (props: KeywordFilterProps) => {
   const { t, locale } = useLanguage();
   const {
      device,
      setDevice,
      filterKeywords,
      allTags = [],
      keywords = [],
      updateSort,
      sortBy,
      filterParams,
      isConsole = false,
      integratedConsole = false,
      updateColumns,
      SCcountries = [],
      tableColumns = [],
   } = props;
   const [sortOptions, showSortOptions] = useState(false);
   const [filterOptions, showFilterOptions] = useState(false);
   const [columnOptions, showColumnOptions] = useState(false);

   const keywordCounts = useMemo(() => {
      const counts = { desktop: 0, mobile: 0 };
      if (keywords && keywords.length > 0) {
         keywords.forEach((k) => {
            if (k.device === 'desktop') {
               counts.desktop += 1;
            } else {
               counts.mobile += 1;
            }
         });
      }
      return counts;
   }, [keywords]);

   const filterCountry = (cntrs: string[]) => filterKeywords({ ...filterParams, countries: cntrs });

   const filterTags = (tags: string[]) => filterKeywords({ ...filterParams, tags });

   const searchKeywords = (event: React.FormEvent<HTMLInputElement>) => {
      const filtered = filterKeywords({ ...filterParams, search: event.currentTarget.value });
      return filtered;
   };

   const countryOptions = useMemo(() => {
      const optionObject: { label: string, value: string }[] = [];

      if (!isConsole) {
         const allCountries = Array.from(keywords as KeywordType[])
            .map((keyword) => keyword.country)
            .reduce<string[]>((acc, country) => [...acc, country], [])
            .filter((t) => t && t.trim() !== '');
         [...new Set(allCountries)].forEach((c) => optionObject.push({ label: countries[c][0], value: c }));
      } else {
         Object.keys(countries).forEach((countryISO: string) => {
            if ((SCcountries.includes(countryISO))) {
               optionObject.push({ label: countries[countryISO][0], value: countryISO });
            }
         });
      }

      return optionObject;
   }, [SCcountries, isConsole, keywords]);

   const defaultText = locale === 'de' ? ' (Standard)' : ' (Default)';

   const sortOptionChoices: SelectionOption[] = [
      { value: 'pos_asc', label: t('sortOptions.pos_asc') },
      { value: 'pos_desc', label: t('sortOptions.pos_desc') },
      { value: 'date_asc', label: `${t('sortOptions.date_asc')}${defaultText}` },
      { value: 'date_desc', label: t('sortOptions.date_desc') },
      { value: 'alpha_asc', label: t('sortOptions.alpha_asc') },
      { value: 'alpha_desc', label: t('sortOptions.alpha_desc') },
      { value: 'vol_asc', label: t('sortOptions.vol_asc') },
      { value: 'vol_desc', label: t('sortOptions.vol_desc') },
   ];

   const columnOptionChoices: { label: string, value: string, locked: boolean }[] = [
      { value: 'Keyword', label: t('columns.keyword'), locked: true },
      { value: 'Position', label: t('columns.position'), locked: true },
      { value: 'URL', label: t('columns.url'), locked: true },
      { value: 'Updated', label: t('columns.updated'), locked: true },
      { value: 'Best', label: t('columns.best'), locked: false },
      { value: 'History', label: t('columns.history'), locked: false },
      { value: 'Volume', label: t('columns.volume'), locked: false },
      { value: 'Search Console', label: t('columns.searchConsole'), locked: false },
   ];

   if (integratedConsole) {
      sortOptionChoices.push({ value: 'imp_desc', label: `${t('sortOptions.imp_desc')}${isConsole ? defaultText : ''}` });
      sortOptionChoices.push({ value: 'imp_asc', label: t('sortOptions.imp_asc') });
      sortOptionChoices.push({ value: 'visits_desc', label: t('sortOptions.visits_desc') });
      sortOptionChoices.push({ value: 'visits_asc', label: t('sortOptions.visits_asc') });
   }
   if (isConsole) {
      sortOptionChoices.splice(2, 2);
      sortOptionChoices.push({ value: 'ctr_asc', label: t('sortOptions.ctr_asc') });
      sortOptionChoices.push({ value: 'ctr_desc', label: t('sortOptions.ctr_desc') });
   }
   const sortItemStyle = (sortType: string) => {
      return `cursor-pointer py-2 px-3 hover:bg-[#FCFCFF] ${sortBy === sortType ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-50' : ''}`;
   };
   const deviceTabStyle = 'select-none cursor-pointer px-3 py-2 rounded-3xl mr-2';
   const deviceTabCountStyle = 'px-2 py-0 rounded-3xl bg-[#DEE1FC] text-[0.7rem] font-bold ml-1';
   const mobileFilterOptionsStyle = 'visible mt-8 border absolute min-w-[0] rounded-lg max-h-96 bg-white z-50 w-52 right-2 p-4';

   return (
      <div className='domKeywords_filters py-4 px-6 flex justify-between text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0'>
         <div>
            <ul className='flex text-xs'>
               <li
                  data-testid="desktop_tab"
                  className={`select-none cursor-pointer px-4 py-1.5 rounded-full mr-2 transition-all border ${device === 'desktop' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => setDevice('desktop')}>
                  <Icon type='desktop' classes={`top-[2px] ${device === 'desktop' ? 'text-indigo-600' : 'text-gray-400'}`} size={14} />
                  <i className='hidden not-italic lg:inline-block ml-2 font-medium'>{t('keywordFilter.desktop')}</i>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 ${device === 'desktop' ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>{keywordCounts.desktop}</span>
               </li>
               <li
                  data-testid="mobile_tab"
                  className={`select-none cursor-pointer px-4 py-1.5 rounded-full mr-2 transition-all border ${device === 'mobile' ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'}`}
                  onClick={() => setDevice('mobile')}>
                  <Icon type='mobile' classes={`top-[2px] ${device === 'mobile' ? 'text-indigo-600' : 'text-gray-400'}`} size={14} />
                  <i className='hidden not-italic lg:inline-block ml-2 font-medium'>{t('keywordFilter.mobile')}</i>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ml-2 ${device === 'mobile' ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>{keywordCounts.mobile}</span>
               </li>
            </ul>
         </div>
         <div className='flex gap-5'>
            <div className=' lg:hidden'>
               <button
                  data-testid="filter_button"
                  className={`px-2 py-1 rounded ${filterOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                  title={t('keywordFilter.filter')}
                  onClick={() => showFilterOptions(!filterOptions)}>
                  <Icon type="filter" size={18} />
               </button>
            </div>
            <div className={`lg:flex gap-5 lg:visible ${filterOptions ? mobileFilterOptionsStyle : 'hidden'}`}>

               {/* Action Buttons: Moved before Country Filter */}
               {props.onReload && (
                  <button
                     onClick={props.onReload}
                     className="hidden lg:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors items-center h-[34px]"
                     title={t('keywordFilter.reloadSerps')}
                  >
                     <Icon type='reload' size={16} />
                  </button>
               )}
               {props.onAddKeyword && (
                  <button
                     className={'hidden lg:flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-xs font-semibold h-[34px]'}
                     onClick={props.onAddKeyword}
                  >
                     <span className="text-lg leading-none mb-0.5">+</span> {t('keywordFilter.addKeyword')}
                  </button>
               )}

               <div className={'country_filter mb-2 lg:mb-0'}>
                  <SelectField
                     selected={filterParams.countries}
                     options={countryOptions}
                     defaultLabel={t('keywordFilter.allCountries')}
                     updateField={(updated: string[]) => filterCountry(updated)}
                     flags={true}
                  />
               </div>

               {!isConsole && (
                  <div className={'tags_filter mb-2 lg:mb-0'}>
                     <SelectField
                        selected={filterParams.tags}
                        options={allTags.map((tag: string) => ({ label: tag, value: tag }))}
                        defaultLabel={t('keywordFilter.allTags')}
                        updateField={(updated: string[]) => filterTags(updated)}
                        emptyMsg={t('keywordFilter.noTags')}
                     />
                  </div>
               )}
               <div className={'mb-2 lg:mb-0'}>
                  <input
                     data-testid="filter_input"
                     className={'border border-gray-200 w-44 lg:w-36 focus:w-44 transition-all rounded-full p-1.5 px-4 outline-none ring-0 focus:border-indigo-300 focus:shadow-sm text-xs'}
                     type="text"
                     placeholder={t('keywordFilter.filterKeywords')}
                     onChange={searchKeywords}
                     value={filterParams.search}
                  />
               </div>
            </div>
            <div className='relative'>
               <button
                  data-testid="sort_button"
                  className={`px-2 py-1 rounded ${sortOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                  title={t('keywordFilter.sort')}
                  onClick={() => showSortOptions(!sortOptions)}>
                  <Icon type="sort" size={18} />
               </button>
               {sortOptions && (
                  <ul
                     data-testid="sort_options"
                     className='sort_options mt-2 border absolute w-48 min-w-[0] right-0 rounded-lg
                     max-h-96 bg-white z-[9999] overflow-y-auto styled-scrollbar'>
                     {sortOptionChoices.map((sortOption) => {
                        return <li
                           key={sortOption.value}
                           className={sortItemStyle(sortOption.value)}
                           onClick={() => { updateSort(sortOption.value); showSortOptions(false); }}>
                           {sortOption.label}
                        </li>;
                     })}
                  </ul>
               )}
            </div>
            {!isConsole && (
               <div className='relative'>
                  <button
                     data-testid="columns_button"
                     className={`px-2 py-1 rounded ${columnOptions ? ' bg-indigo-100 text-blue-700' : ''}`}
                     title={t('keywordFilter.columns')}
                     onClick={() => showColumnOptions(!columnOptions)}
                  >
                     <Icon type='eye-closed' size={18} />
                  </button>
                  {columnOptions && (
                     <ul
                        data-testid="sort_options"
                        className='sort_options mt-2 border absolute w-48 min-w-[0] right-0 rounded-lg
                     max-h-96 bg-white z-[9999] overflow-y-auto styled-scrollbar border-gray-200 '>
                        {columnOptionChoices.map(({ value, label, locked }) => {
                           return <li
                              key={value}
                              className={sortItemStyle(value) + (locked ? 'bg-gray-50 cursor-not-allowed pointer-events-none' : '')}
                              onClick={() => { if (updateColumns) { updateColumns(value); } showColumnOptions(false); }}
                           >
                              <span className={' inline-block px-[3px] border border-gray-200  rounded-[4px] w-5'}>
                                 <Icon
                                    title={locked ? 'Cannot be Hidden' : ''}
                                    type={locked ? 'lock' : 'check'}
                                    color={!tableColumns.includes(value) && !locked ? 'transparent' : '#999'}
                                    size={12}
                                 />
                              </span>
                              {' '}{label}

                           </li>;
                        })}
                     </ul>
                  )}
               </div>
            )}
         </div>
      </div>
   );
};

export default KeywordFilters;
