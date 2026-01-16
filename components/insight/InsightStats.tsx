import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formattedNum } from '../../utils/client/helpers';
import { useLanguage } from '../../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type InsightStatsProps = {
   stats: SearchAnalyticsStat[],
   totalKeywords: number,
   totalCountries: number,
   totalPages: number,
}

const InsightStats = ({ stats = [], totalKeywords = 0, totalPages = 0 }: InsightStatsProps) => {
   const { t } = useLanguage();
   const [chartView, setChartView] = useState<'both' | 'visits' | 'impressions'>('both');

   const totalStat = useMemo(() => {
      const totals = stats.reduce((acc, item) => {
         return {
            impressions: item.impressions + acc.impressions,
            clicks: item.clicks + acc.clicks,
            position: item.position + acc.position,
         };
      }, { impressions: 0, clicks: 0, position: 0 });

      return {
         ...totals,
         ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      };
   }, [stats]);

   // Calculate percentage change (comparing first half vs second half)
   const getPercentageChange = (type: 'clicks' | 'impressions' | 'position' | 'ctr') => {
      if (stats.length < 2) return null;
      const midPoint = Math.floor(stats.length / 2);
      const firstHalf = stats.slice(0, midPoint);
      const secondHalf = stats.slice(midPoint);

      const firstTotal = firstHalf.reduce((acc, item) => acc + item[type], 0) / firstHalf.length;
      const secondTotal = secondHalf.reduce((acc, item) => acc + item[type], 0) / secondHalf.length;

      if (firstTotal === 0) return null;
      const change = ((secondTotal - firstTotal) / firstTotal) * 100;
      return change;
   };

   const renderChangeIndicator = (change: number | null, inverse = false) => {
      if (change === null) return null;
      const isPositive = inverse ? change < 0 : change > 0;
      const color = isPositive ? 'text-green-600' : 'text-red-600';
      const arrow = isPositive ? '↑' : '↓';
      return (
         <span className={`text-xs font-medium ${color} ml-2`}>
            {arrow} {Math.abs(change).toFixed(1)}%
         </span>
      );
   };

   const chartData = useMemo(() => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartSeries: { [key: string]: number[] } = { clicks: [], impressions: [], position: [], ctr: [] };
      stats.forEach((item) => {
         chartSeries.clicks.push(item.clicks);
         chartSeries.impressions.push(item.impressions);
         chartSeries.position.push(item.position);
         chartSeries.ctr.push(item.ctr);
      });
      return {
         labels: stats && stats.length > 0 ? stats.map((item) => `${new Date(item.date).getDate()}-${months[new Date(item.date).getMonth()]}`) : [],
         series: chartSeries
      };
   }, [stats]);

   const renderChart = () => {
      const chartOptions = {
         responsive: true,
         maintainAspectRatio: false,
         animation: false as const,
         interaction: {
            mode: 'index' as const,
            intersect: false,
         },
         scales: {
            x: {
               grid: {
                  display: false,
               },
               ticks: {
                  color: '#6B7280',
                  font: {
                     size: 11,
                  }
               }
            },
            y: {
               display: chartView === 'both' || chartView === 'visits',
               position: 'left' as const,
               grid: {
                  color: '#F3F4F6',
               },
               ticks: {
                  color: '#6B7280',
                  font: {
                     size: 11,
                  }
               }
            },
            y1: {
               display: chartView === 'both' || chartView === 'impressions',
               position: 'right' as const,
               grid: {
                  display: false,
               },
               ticks: {
                  color: '#6B7280',
                  font: {
                     size: 11,
                  }
               }
            },
         },
         plugins: {
            legend: {
               display: true,
               position: 'top' as const,
               align: 'end' as const,
               labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                     size: 12,
                     weight: 'bold' as const,
                  }
               }
            },
            tooltip: {
               backgroundColor: 'rgba(0, 0, 0, 0.8)',
               padding: 12,
               titleFont: {
                  size: 13,
                  weight: 'bold' as const,
               },
               bodyFont: {
                  size: 12,
               },
               cornerRadius: 8,
            }
         },
      };
      const { clicks, impressions } = chartData.series || {};
      const dataSet = [];

      if (chartView === 'both' || chartView === 'visits') {
         dataSet.push({
            label: t('insight.visits'),
            data: clicks,
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgb(139, 92, 246)',
            yAxisID: 'y'
         });
      }

      if (chartView === 'both' || chartView === 'impressions') {
         dataSet.push({
            label: t('insight.impressions'),
            data: impressions,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            yAxisID: chartView === 'both' ? 'y1' : 'y'
         });
      }

      return <Line datasetIdKey={'xxx'} options={chartOptions} data={{ labels: chartData.labels, datasets: dataSet }} />;
   };

   return (
      <div className='p-6 lg:border-t lg:border-gray-200'>
         <div className='flex font-bold flex-wrap lg:flex-nowrap gap-4'>
            {/* Visits Card */}
            <div className='flex-1 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-violet-600'>{t('insight.visits')}</span>
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
               </div>
               <div className='flex items-baseline'>
                  <div className='text-3xl font-bold text-violet-700' title={`${formattedNum(totalStat.clicks || 0)} ${t('insight.visits')}`}>
                     {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(totalStat.clicks || 0).replace('T', 'K')}
                  </div>
                  {renderChangeIndicator(getPercentageChange('clicks'))}
               </div>
            </div>

            {/* Impressions Card */}
            <div className='flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-emerald-600'>{t('insight.impressions')}</span>
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
               </div>
               <div className='flex items-baseline'>
                  <div className='text-3xl font-bold text-emerald-700' title={`${formattedNum(totalStat.impressions || 0)} ${t('insight.impressions')}`}>
                     {new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(totalStat.impressions || 0).replace('T', 'K')}
                  </div>
                  {renderChangeIndicator(getPercentageChange('impressions'))}
               </div>
            </div>

            {/* Avg Position Card */}
            <div className='flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-blue-600'>{t('insight.avgPosition')}</span>
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
               </div>
               <div className='flex items-baseline'>
                  <div className='text-3xl font-bold text-blue-700'>
                     {(totalStat.position ? Math.round(totalStat.position / stats.length) : 0)}
                  </div>
                  {renderChangeIndicator(getPercentageChange('position'), true)}
               </div>
            </div>

            {/* Avg CTR Card */}
            <div className='flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-amber-600'>{t('insight.avgCtr')}</span>
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
               </div>
               <div className='flex items-baseline'>
                  <div className='text-3xl font-bold text-amber-700'>
                     {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalStat.ctr || 0)}%
                  </div>
                  {renderChangeIndicator(getPercentageChange('ctr'))}
               </div>
            </div>

            {/* Keywords Card */}
            <div className='flex-1 bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-pink-600'>{t('insight.keywords')}</span>
                  <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
               </div>
               <div className='text-3xl font-bold text-pink-700'>
                  {formattedNum(totalKeywords)}
               </div>
            </div>

            {/* Pages Card */}
            <div className='flex-1 bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 px-6 py-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200'>
               <div className='flex items-center justify-between mb-2'>
                  <span className='block text-sm font-medium text-cyan-600'>{t('insight.pages')}</span>
                  <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
               </div>
               <div className='text-3xl font-bold text-cyan-700'>
                  {formattedNum(totalPages)}
               </div>
            </div>
         </div>

         {/* Chart */}
         <div className='mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
               <h3 className='text-lg font-semibold text-gray-800'>{t('insight.performanceOverview')}</h3>
               <div className='flex gap-2'>
                  <button
                     onClick={() => setChartView('both')}
                     className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'both'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                  >
                     {t('insight.both')}
                  </button>
                  <button
                     onClick={() => setChartView('visits')}
                     className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'visits'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                  >
                     {t('insight.visits')}
                  </button>
                  <button
                     onClick={() => setChartView('impressions')}
                     className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${chartView === 'impressions'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                  >
                     {t('insight.impressions')}
                  </button>
               </div>
            </div>
            <div className='h-80'>
               {renderChart()}
            </div>
         </div>
      </div>
   );
};

export default InsightStats;
