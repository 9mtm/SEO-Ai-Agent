import React from 'react';

type CompetitorsTableProps = {
    domain: DomainType | null;
    keywords: KeywordType[];
    isPending: boolean;
};

const CompetitorsTable = ({ domain, keywords, isPending }: CompetitorsTableProps) => {
    // Get competitors from domain
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${position > 0 && position <= 10
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : position > 10 && position <= 50
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {position > 0 ? position : '-'}
                                                </span>
                                            </td>
                                        );
                                    })}
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
