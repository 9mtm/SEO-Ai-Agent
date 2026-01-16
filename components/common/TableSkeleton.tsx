import React from 'react';

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
    return (
        <div className="w-full animate-pulse bg-white">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-gray-100 py-4 px-6 last:border-0">
                    {/* Checkbox */}
                    <div className="h-4 w-4 bg-gray-100 rounded shrink-0"></div>

                    {/* Flag & Keyword */}
                    <div className="flex-1 flex items-center gap-3">
                        <div className="h-3 w-5 bg-gray-100 rounded shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-gray-200 rounded w-1/3 min-w-[150px]"></div>
                        </div>
                    </div>

                    {/* Desktop Columns */}
                    <div className="hidden lg:flex gap-8 items-center">
                        {/* Rank */}
                        <div className="h-6 w-8 bg-gray-100 rounded"></div>
                        {/* Best */}
                        <div className="h-4 w-8 bg-gray-100 rounded"></div>
                        {/* History Chart */}
                        <div className="h-8 w-16 bg-gray-50 rounded"></div>
                        {/* Volume */}
                        <div className="h-4 w-10 bg-gray-100 rounded"></div>
                        {/* URL */}
                        <div className="h-3 w-20 bg-gray-50 rounded"></div>
                        {/* Date */}
                        <div className="h-3 w-16 bg-gray-50 rounded"></div>
                    </div>

                    {/* Menu Dots */}
                    <div className="h-6 w-6 bg-gray-100 rounded-full shrink-0 ml-2"></div>
                </div>
            ))}
        </div>
    );
};

export default TableSkeleton;
