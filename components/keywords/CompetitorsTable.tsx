import React from 'react';
import { useRefreshCompetitors } from '../../services/competitors';

type CompetitorsTableProps = {
    domain: DomainType | null;
    keywords: KeywordType[];
    isPending: boolean;
    isConsoleIntegrated?: boolean;
    settings?: SettingsType;
};

const CompetitorsTable = ({ domain, keywords, isPending, isConsoleIntegrated, settings }: CompetitorsTableProps) => {
    const { mutate: refreshCompetitorsMutate } = useRefreshCompetitors(() => { });
    const competitors = domain?.competitors || [];

    if (isPending) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!keywords || keywords.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-gray-500">No keywords added yet. Add keywords from the Keywords page.</div>
            </div>
        );
    }

    if (!competitors || competitors.length === 0) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-gray-500">No competitors added yet. Add competitors from domain settings.</div>
            </div>
        );
    }

    const handleRefreshKeyword = (keywordId: number) => {
        if (domain) {
            refreshCompetitorsMutate({ domain: domain.domain, keywordId });
        }
    };

    return (
        <div className="w-full bg-white rounded-md shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Keyword
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Your Position
                            </th>
                            {competitors.map((competitor: string, index: number) => (
                                <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {competitor.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {keywords.map((keyword) => {
                            const competitorPositions = keyword.competitor_positions || {};

                            return (
                                <tr key={keyword.ID} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {keyword.keyword}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${keyword.position > 0 && keyword.position <= 10
                                            ? 'bg-green-100 text-green-800'
                                            : keyword.position > 10 && keyword.position <= 50
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {keyword.position > 0 ? keyword.position : '-'}
                                        </span>
                                    </td>
                                    {competitors.map((competitor: string, index: number) => {
                                        const cleanCompetitor = competitor.replace(/^https?:\/\//, '').replace(/\/$/, '');
                                        const position = competitorPositions[cleanCompetitor] || 0;

                                        return (
                                            <td key={index} className="px-4 py-3 text-center">
                                                {keyword.updating_competitors ? (
                                                    <div className="inline-flex items-center">
                                                        <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    </div>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position > 0 && position <= 10
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : position > 10 && position <= 50
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {position > 0 ? position : '-'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleRefreshKeyword(keyword.ID)}
                                            disabled={keyword.updating_competitors}
                                            className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Refresh competitors for this keyword"
                                        >
                                            <svg className={`w-4 h-4 ${keyword.updating_competitors ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
                Showing {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} with {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default CompetitorsTable;
