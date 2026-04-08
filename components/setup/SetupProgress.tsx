import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

export default function SetupProgress() {
    const [status, setStatus] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/user/setup-status')
            .then(res => res.json())
            .then(data => setStatus(data))
            .catch(err => console.error(err));
    }, []);

    // Don't show if loading or if fully complete (optional, or maybe show minimal "Complete")
    // If complete, maybe just hide it to save space?
    if (!status) return <div className="p-4 mx-4 animate-pulse bg-gray-100 h-32 rounded-lg"></div>;

    // If 100%, hide it from sidebar?
    // If 100%, hide it from sidebar
    if (status.percentage === 100) return null;

    // Safety check for steps (e.g. on 401 error or malformed response)
    if (!status.steps) return null;

    return (
        <div className="mx-3 mb-6 bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-blue-900">Setup Guide</h4>
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        {status.percentage}%
                    </span>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-1.5">
                    <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                        style={{ width: `${status.percentage}%` }}
                    ></div>
                </div>
            </div>

            <div className="p-3 space-y-3">
                <StepItem label="Connect Account & Site" done={status.steps.gsc_domain} active={!status.steps.gsc_domain} />
                <StepItem label="Scraper Configuration" done={status.steps.scraper} active={status.steps.gsc_domain && !status.steps.scraper} />
                <StepItem label="Connect AI Assistant" done={status.steps.ai_connected} active={status.steps.scraper && !status.steps.ai_connected} />
            </div>

            <div className="p-3 pt-0">
                <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all text-xs h-8"
                    onClick={() => router.push('/setup')}
                >
                    Continue Setup <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
            </div>
        </div>
    );
}

const StepItem = ({ label, done, active }: { label: string, done: boolean, active: boolean }) => (
    <div className={`flex items-center gap-2.5 text-xs transition-colors ${active ? 'opacity-100' : 'opacity-70'}`}>
        {done ? (
            <div className="bg-green-100 text-green-600 rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3" />
            </div>
        ) : (
            <div className={`rounded-full p-0.5 ${active ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                <Circle className="h-3 w-3" />
            </div>
        )}
        <span className={`${done ? "text-green-800 font-medium" : (active ? "text-blue-900 font-bold" : "text-neutral-500")}`}>
            {label}
        </span>
    </div>
);
