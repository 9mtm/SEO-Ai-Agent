import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formattedNum } from '../../utils/client/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type BingInsightProps = {
  domain: DomainType | null;
};

type BingKeyword = {
  keyword: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
  page?: string;
};

type ChartPoint = {
  date: string;
  clicks: number;
  impressions: number;
};

const BingInsight = ({ domain }: BingInsightProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [keywords, setKeywords] = useState<BingKeyword[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'keywords'>('stats');
  const [daysFilter, setDaysFilter] = useState(30);
  const [sortBy, setSortBy] = useState<string>('clicks');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [chartView, setChartView] = useState<'both' | 'visits' | 'impressions'>('both');
  const itemsPerPage = 20;

  useEffect(() => {
    if (!domain?.domain) return;

    const fetchBingData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const siteUrl = domain.domain.startsWith('http') ? domain.domain : `https://${domain.domain}`;
        const res = await fetch(`/api/bing/stats?siteUrl=${encodeURIComponent(siteUrl)}&days=${daysFilter}`, { headers });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch Bing data');
        }

        const data = await res.json();
        setStats(data.stats);
        setChart(data.chart || []);
        setKeywords(data.keywords || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBingData();
  }, [domain?.domain, daysFilter]);

  // Sorted and filtered keywords
  const { filteredItems, totalPages, topPerformers } = useMemo(() => {
    let items = [...keywords];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(k => k.keyword.toLowerCase().includes(q));
    }

    // Sort
    items.sort((a, b) => {
      const key = sortBy.replace(/_asc|_desc/, '') as keyof BingKeyword;
      const dir = sortBy.endsWith('_asc') ? 1 : -1;
      return ((Number(b[key]) || 0) - (Number(a[key]) || 0)) * dir;
    });

    const top = items.slice(0, 5);
    const total = Math.ceil(items.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = items.slice(start, start + itemsPerPage);

    return { filteredItems: paginated, totalPages: total, topPerformers: top };
  }, [keywords, sortBy, searchQuery, currentPage]);

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

  const exportToCSV = () => {
    if (keywords.length === 0) return;
    const headers = ['Keyword', 'Clicks', 'Impressions', 'CTR', 'Position'];
    const rows = keywords.map(k => [k.keyword, k.clicks, k.impressions, `${k.ctr}%`, k.position.toFixed(1)]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bing-keywords-${domain?.domain || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart data
  const chartData = useMemo(() => {
    if (!chart || chart.length === 0) return null;
    const labels = chart.map(c => {
      const d = new Date(c.date);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    const datasets: any[] = [];
    if (chartView !== 'impressions') {
      datasets.push({
        label: 'Clicks',
        data: chart.map(c => c.clicks),
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 1,
      });
    }
    if (chartView !== 'visits') {
      datasets.push({
        label: 'Impressions',
        data: chart.map(c => c.impressions),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 1,
      });
    }

    return { labels, datasets };
  }, [chart, chartView]);

  const deviceTabStyle = 'select-none cursor-pointer px-4 py-2.5 rounded-lg mr-2 transition-all duration-200 font-medium';
  const deviceTabCountStyle = 'px-2 py-0.5 rounded-full bg-teal-100 text-[0.7rem] font-bold ml-2 text-teal-700';

  if (loading) {
    return (
      <div className='domKeywords flex flex-col bg-white rounded-md text-sm border mb-5 shadow-sm'>
        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-5 animate-pulse">
                <div className="h-3 w-20 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 w-24 bg-gray-300 rounded mb-2"></div>
                <div className="h-2 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 animate-pulse">
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
            Syncing Bing data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='domKeywords flex flex-col bg-white rounded-md text-sm border mb-5 shadow-sm'>
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Failed to load Bing data</p>
          <p className="text-sm mt-2 mb-6 text-red-500">{error}</p>
          <Link href="/profile/search-console" className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors">
            Check Bing connection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='domKeywords flex flex-col bg-white rounded-md text-sm border mb-5 shadow-sm'>
        {/* Tabs + Date Filter */}
        <div className='domKeywords_filters py-4 px-6 flex flex-col justify-between text-sm text-gray-500 font-semibold border-b-[1px] lg:border-0 lg:flex-row'>
          <div className='flex items-center justify-between w-full lg:w-auto'>
            <ul className='text-xs hidden lg:flex'>
              {(['stats', 'keywords'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <li
                    key={tab}
                    className={`${deviceTabStyle} ${isActive ? 'bg-teal-100 text-teal-700 shadow-sm' : 'hover:bg-gray-100'}`}
                    onClick={() => { setActiveTab(tab); setCurrentPage(1); setSearchQuery(''); }}
                  >
                    <i className='hidden not-italic lg:inline-block capitalize'>{tab === 'stats' ? 'Stats' : 'Keywords'}</i>
                    {tab === 'keywords' && (
                      <span className={deviceTabCountStyle}>{keywords.length}</span>
                    )}
                  </li>
                );
              })}

              {/* Export Button */}
              {activeTab === 'keywords' && keywords.length > 0 && (
                <button onClick={exportToCSV} className='ml-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2'>
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                  Export CSV
                </button>
              )}
            </ul>
          </div>

          {/* Date Range Filter */}
          <div className='py-2 text-xs text-center mt-2 lg:text-sm lg:mt-0 flex items-center gap-2'>
            {[
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 },
            ].map(({ label, days }) => (
              <button
                key={days}
                onClick={() => { setDaysFilter(days); setCurrentPage(1); }}
                className={`px-3 py-1 rounded-full transition-all ${daysFilter === days ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar (keywords tab) */}
        {activeTab === 'keywords' && (
          <div className='px-6 py-3 border-b border-gray-200'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search keywords...'
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className='w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
              />
              <svg className='absolute left-3 top-2.5 w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </div>
          </div>
        )}

        {/* Stats Tab — KPI Cards + Chart */}
        {activeTab === 'stats' && stats && (
          <div className='px-6 py-6'>
            {/* KPI Cards */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
              <div className='bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-xl p-5'>
                <p className='text-xs font-medium text-gray-500 mb-1'>Total Clicks</p>
                <p className='text-2xl font-bold text-teal-700'>{formattedNum(stats.totalClicks)}</p>
              </div>
              <div className='bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5'>
                <p className='text-xs font-medium text-gray-500 mb-1'>Total Impressions</p>
                <p className='text-2xl font-bold text-purple-700'>{formattedNum(stats.totalImpressions)}</p>
              </div>
              <div className='bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-5'>
                <p className='text-xs font-medium text-gray-500 mb-1'>CTR</p>
                <p className='text-2xl font-bold text-green-700'>{stats.ctr}%</p>
              </div>
              <div className='bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-xl p-5'>
                <p className='text-xs font-medium text-gray-500 mb-1'>Avg. Position</p>
                <p className='text-2xl font-bold text-orange-700'>{stats.avgPosition}</p>
              </div>
            </div>

            {/* Chart Toggle */}
            <div className='flex gap-2 mb-4'>
              {(['both', 'visits', 'impressions'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${chartView === view ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {view === 'both' ? 'Both' : view === 'visits' ? 'Clicks' : 'Impressions'}
                </button>
              ))}
            </div>

            {/* Chart */}
            {chartData && chartData.labels.length > 0 ? (
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-100'>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: {
                      x: { grid: { display: false } },
                      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    },
                  }}
                />
              </div>
            ) : (
              <div className='bg-gray-50 rounded-lg p-8 border border-gray-100 text-center text-gray-400'>
                No chart data available yet. Data will appear after the first sync.
              </div>
            )}
          </div>
        )}

        {/* Top Performers (keywords tab) */}
        {activeTab === 'keywords' && topPerformers.length > 0 && !searchQuery && (
          <div className='px-6 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200'>
            <h3 className='text-sm font-semibold text-teal-700 mb-3 flex items-center'>
              <svg className='w-5 h-5 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
              </svg>
              Top Performers
            </h3>
            <div className='flex gap-2 overflow-x-auto pb-2'>
              {topPerformers.map((item, idx) => (
                <div key={idx} className='flex-shrink-0 bg-white border border-teal-200 rounded-lg px-3 py-2 min-w-[200px]'>
                  <div className='text-xs font-semibold text-gray-800 truncate mb-1'>{item.keyword}</div>
                  <div className='flex items-center justify-between text-xs'>
                    <span className='text-teal-600 font-bold'>{item.clicks} clicks</span>
                    <span className='text-gray-500'>Pos: {item.position.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keywords Table */}
        {activeTab === 'keywords' && (
          <div className='domkeywordsTable styled-scrollbar w-full overflow-auto min-h-[60vh]'>
            <div className='lg:min-w-[800px]'>
              {/* Table Header */}
              <div className='hidden text-xs text-gray-500 font-semibold px-6 py-3 border-b border-gray-200 lg:flex lg:justify-between lg:items-center'>
                {[
                  { label: 'Keyword', key: 'keyword', className: 'flex-1 basis-20 w-auto text-left' },
                  { label: 'Position', key: 'position', className: 'flex-1 basis-40 grow-0 text-center' },
                  { label: 'Clicks', key: 'clicks', className: 'flex-1 text-center' },
                  { label: 'Impressions', key: 'impressions', className: 'flex-1 text-center' },
                  { label: 'CTR', key: 'ctr', className: 'flex-1 text-center' },
                ].map((h) => (
                  <span key={h.key} className={`${h.className} cursor-pointer hover:text-teal-700 select-none`} onClick={() => handleSort(h.key)}>
                    {h.label}{getSortIcon(h.key)}
                  </span>
                ))}
              </div>

              {/* Table Rows */}
              <div className='min-h-[55vh] relative'>
                {filteredItems.map((item, index) => (
                  <div key={index} className={`relative py-4 px-6 lg:flex lg:justify-between lg:items-center ${index !== filteredItems.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                    <span className='flex-1 basis-20 text-left font-medium text-gray-800 truncate block max-w-[300px]' title={item.keyword}>
                      {item.keyword}
                    </span>
                    <span className='flex-1 basis-40 grow-0 text-center'>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${item.position <= 3 ? 'bg-green-100 text-green-700' : item.position <= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {item.position.toFixed(1)}
                      </span>
                    </span>
                    <span className='flex-1 text-center font-semibold text-teal-700'>{formattedNum(item.clicks)}</span>
                    <span className='flex-1 text-center text-gray-600'>{formattedNum(item.impressions)}</span>
                    <span className='flex-1 text-center text-gray-600'>{item.ctr.toFixed(2)}%</span>
                  </div>
                ))}

                {filteredItems.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p>{searchQuery ? `No results for "${searchQuery}"` : 'No keyword data available'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'keywords' && totalPages > 1 && (
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
    </div>
  );
};

export default BingInsight;
