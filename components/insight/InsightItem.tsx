import React from 'react';
import countries from '../../utils/countries';
import Icon from '../common/Icon';
import { formattedNum } from '../../utils/client/helpers';

type InsightItemProps = {
   item: SCInsightItem,
   lastItem: boolean,
   type: string,
   domain: string
}

const InsightItem = ({ item, lastItem, type, domain }: InsightItemProps) => {
   const { clicks, impressions, ctr, position, country = 'zzz', keyword, page, keywords = 0, countries: cntrs = 0, date } = item;
   let firstItem = keyword;
   if (type === 'pages') { firstItem = page; } if (type === 'stats') {
      firstItem = date && new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
   }
   if (type === 'countries') { firstItem = countries[country] && countries[country][0]; }

   // Color coding helpers
   const getPositionColor = (pos: number) => {
      if (pos <= 3) return 'text-green-600 bg-green-50';
      if (pos <= 10) return 'text-blue-600 bg-blue-50';
      if (pos <= 20) return 'text-yellow-600 bg-yellow-50';
      return 'text-gray-600 bg-gray-50';
   };

   const getCTRColor = (ctrValue: number) => {
      if (ctrValue >= 5) return 'text-green-600';
      if (ctrValue >= 2) return 'text-yellow-600';
      return 'text-gray-600';
   };

   const getClicksColor = (clicksValue: number) => {
      if (clicksValue >= 100) return 'text-violet-700 font-bold';
      if (clicksValue >= 50) return 'text-violet-600 font-semibold';
      return 'text-gray-700';
   };

   return (
      <div
         className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
      lg:flex lg:justify-between lg:items-center hover:bg-gray-50 transition-colors ${lastItem ? 'border-b-0' : ''}`}>

         <div className='w-3/4 lg:flex-1 lg:basis-20 lg:w-auto font-semibold text-gray-800'>
            {type === 'countries' && <span className={`fflag fflag-${country} w-[18px] h-[12px] mr-2`} />}
            {type === 'pages' && domain ? <a href={`https://${domain}${page}`} target='_blank' rel="noreferrer" className='text-blue-600 hover:text-blue-800 hover:underline'>{firstItem}</a> : firstItem}
         </div>

         <div className='keyword_pos text-center inline-block mr-3 lg:mr-0 lg:flex-1'>
            <span className='mr-1 lg:hidden'>
               <Icon type="tracking" size={14} color="#999" />
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
               {Math.round(position)}
            </span>
         </div>

         <div className={`keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-14 p-2 text-base mt-[-55px] rounded right-5 lg:relative
          lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-40 lg:grow-0 lg:right-0 text-center ${getClicksColor(clicks)}`}>
            {formattedNum(clicks)}
            <span className='block text-xs text-gray-500 lg:hidden'>Visits</span>
         </div>

         <div className='keyword_imp text-center inline-block mr-3 lg:mr-0 lg:flex-1 font-medium text-gray-700'>
            <span className='mr-1 lg:hidden'>
               <Icon type="eye" size={14} color="#999" />
            </span>
            {formattedNum(impressions)}
         </div>

         <div className={`keyword_ctr text-center inline-block mt-4 relative mr-3 lg:mr-0 lg:flex-1 lg:m-0 font-semibold ${getCTRColor(ctr)}`}>
            <span className='mr-1 lg:hidden'>
               <Icon type="target" size={14} color="#999" />
            </span>
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ctr)}%
         </div>

         {(type === 'pages' || type === 'keywords') && (
            <div className='keyword_imp text-center hidden lg:inline-block lg:flex-1 text-gray-600'>{formattedNum(cntrs)}</div>
         )}

         {(type === 'countries' || type === 'pages') && (
            <div className='keyword_imp text-center hidden lg:inline-block lg:flex-1 text-gray-600'>{formattedNum(keywords)}</div>
         )}
      </div>
   );
};

export default InsightItem;
