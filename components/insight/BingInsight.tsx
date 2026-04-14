import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type BingInsightProps = {
  domain: DomainType | null;
};

type BingStats = {
  totalClicks: number;
  totalImpressions: number;
  ctr: number;
  avgPosition: number;
};

type BingKeyword = {
  keyword: string;
  clicks: number;
  impressions: number;
  position: number;
  ctr: number;
};

type BingPage = {
  page: string;
  clicks: number;
  impressions: number;
  position: number;
};

type BingCountry = {
  country: string;
  clicks: number;
  impressions: number;
};

const BingInsight = ({ domain }: BingInsightProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BingStats | null>(null);
  const [keywords, setKeywords] = useState<BingKeyword[]>([]);
  const [pages, setPages] = useState<BingPage[]>([]);
  const [countries, setCountries] = useState<BingCountry[]>([]);
  const [activeTab, setActiveTab] = useState<'keywords' | 'pages' | 'countries'>('keywords');

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
        const res = await fetch(`/api/bing/stats?siteUrl=${encodeURIComponent(siteUrl)}`, { headers });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch Bing data');
        }

        const data = await res.json();
        setStats(data.stats);
        setKeywords(data.keywords || []);
        setPages(data.pages || []);
        setCountries(data.countries || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBingData();
  }, [domain?.domain]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-neutral-100 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium mb-2">Failed to load Bing data</p>
        <p className="text-red-600 text-sm">{error}</p>
        <Link href="/profile/search-console" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Check Bing connection
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Clicks" value={stats.totalClicks.toLocaleString()} color="text-blue-600" />
          <KpiCard label="Impressions" value={stats.totalImpressions.toLocaleString()} color="text-purple-600" />
          <KpiCard label="CTR" value={`${stats.ctr}%`} color="text-green-600" />
          <KpiCard label="Avg. Position" value={stats.avgPosition.toString()} color="text-orange-600" />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-neutral-200">
        {(['keywords', 'pages', 'countries'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab} ({tab === 'keywords' ? keywords.length : tab === 'pages' ? pages.length : countries.length})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'keywords' && (
        <DataTable
          columns={['Keyword', 'Clicks', 'Impressions', 'CTR', 'Position']}
          rows={keywords.map((k) => [k.keyword, k.clicks, k.impressions, `${k.ctr}%`, k.position.toFixed(1)])}
        />
      )}
      {activeTab === 'pages' && (
        <DataTable
          columns={['Page', 'Clicks', 'Impressions', 'Position']}
          rows={pages.map((p) => [p.page, p.clicks, p.impressions, p.position.toFixed(1)])}
        />
      )}
      {activeTab === 'countries' && (
        <DataTable
          columns={['Country', 'Clicks', 'Impressions']}
          rows={countries.map((c) => [c.country, c.clicks, c.impressions])}
        />
      )}
    </div>
  );
};

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <p className="text-sm text-neutral-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return <p className="text-neutral-500 text-center py-8">No data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {columns.map((col) => (
              <th key={col} className="text-left py-3 px-4 font-medium text-neutral-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-4 text-neutral-700">
                  {j === 0 ? (
                    <span className="max-w-[300px] truncate block" title={String(cell)}>
                      {cell}
                    </span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <p className="text-center text-neutral-400 text-sm py-2">
          Showing 50 of {rows.length} results
        </p>
      )}
    </div>
  );
}

export default BingInsight;
