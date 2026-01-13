import React from 'react';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import KeywordPosition from './KeywordPosition';
import { formattedNum } from '../../utils/client/helpers';

type SCKeywordProps = {
   keywordData: SearchAnalyticsItem,
   selected: boolean,
   selectKeyword: Function,
   lastItem?: boolean,
   isTracked: boolean,
   style: Object
}

const SCKeyword = (props: SCKeywordProps) => {
   const { keywordData, selected, lastItem, selectKeyword, style, isTracked = false } = props;
   const { keyword, uid, position, country, impressions, ctr, clicks } = keywordData;

   // Color helpers
   const getCTRColor = (val: number) => {
      if (val >= 5) return 'text-green-600 font-semibold';
      if (val >= 2) return 'text-yellow-600 font-medium';
      return 'text-gray-600';
   };

   const getVisitsColor = (val: number) => {
      if (val >= 100) return 'text-violet-700 font-bold';
      if (val >= 20) return 'text-violet-600 font-semibold';
      return 'text-gray-700';
   };

   return (
      <div
         key={keyword}
         style={style}
         className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-0 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center hover:bg-gray-50 transition-colors 
      ${selected ? 'bg-indigo-50 hover:bg-indigo-50' : ''} 
      ${lastItem ? 'border-b-0' : ''}`}>

         <div className='w-3/4 lg:flex-1 lg:basis-20 lg:w-auto font-semibold flex items-center lg:h-full lg:py-3'>
            <button
               className={`p-0 mr-3 leading-[0px] inline-flex items-center justify-center rounded w-4 h-4 border transition-colors
               ${isTracked || selected ? ' bg-blue-600 border-blue-600 text-white' : 'border-gray-300 hover:border-blue-400 text-transparent'}
               ${isTracked ? 'bg-gray-400 border-gray-400 cursor-default hover:border-gray-400' : ''}`}
               onClick={() => !isTracked && selectKeyword(uid)}
               title={isTracked ? 'Already in Tracker' : 'Select Keyword'}
            >
               <Icon type="check" size={10} />
            </button>
            <div className='flex items-center min-w-0'>
               <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2 flex-shrink-0 shadow-sm`} title={countries[country] && countries[country][0]} />
               <span className='truncate text-gray-800' title={keyword}>
                  {keyword}
               </span>
               {isTracked && <span className='ml-2 text-[10px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded'>Tracked</span>}
            </div>
         </div>

         <div className={`keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-15 p-2 text-base mt-[-20px] rounded right-5 lg:relative
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-40 lg:grow-0 lg:right-0 text-center flex justify-center items-center lg:h-full lg:py-3`}>
            <KeywordPosition position={position} />
            <span className='block text-xs text-gray-500 lg:hidden'>Position</span>
         </div>

         <div className='keyword_imp text-center inline-block lg:flex-1 font-medium text-gray-600 lg:h-full lg:py-3 flex lg:items-center lg:justify-center'>
            <span className='mr-3 lg:hidden'>
               <Icon type="eye" size={14} color="#999" />
            </span>
            {formattedNum(impressions)}
         </div>

         <div className={`keyword_visits text-center inline-block mt-4 mr-5 ml-5 lg:flex-1 lg:m-0 max-w-[70px] lg:max-w-none lg:pr-5 lg:h-full lg:py-3 flex lg:items-center lg:justify-center ${getVisitsColor(clicks)}`}>
            <span className='mr-3 lg:hidden'>
               <Icon type="cursor" size={14} color="#999" />
            </span>
            {formattedNum(clicks)}
         </div>

         <div className={`keyword_ctr text-center inline-block mt-4 relative lg:flex-1 lg:m-0 lg:h-full lg:py-3 flex lg:items-center lg:justify-center ${getCTRColor(ctr)}`}>
            <span className='mr-3 lg:hidden'>
               <Icon type="target" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ctr)}%
         </div>

      </div>
   );
};

export default SCKeyword;
