import React from 'react';
import { FileText, Calendar, Puzzle, TrendingUp } from 'lucide-react';

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-5xl overflow-hidden min-h-[600px]">

                {/* Left Side - Form Content */}
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
                    {children}
                </div>

                {/* Right Side - Info Panel */}
                <div className="hidden md:flex w-1/2 bg-gray-50 p-12 flex-col justify-center border-l border-gray-100">
                    <div className="mb-6">
                        <div className="flex space-x-3 mb-4 items-center">
                            <img src="/icon/google-logo.svg" alt="Google" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            <img src="/icon/chatgpt-logo.svg" alt="ChatGPT" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            <img src="/icon/claude-logo.svg" alt="Claude" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            <img src="/icon/gemini-logo.svg" alt="Gemini" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            <img src="/icon/perplexity-logo.svg" alt="Perplexity" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                            <img src="/icon/bing-logo.svg" alt="Bing" className="h-6 w-6 object-contain hover:scale-110 transition-transform" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">All-in-One Traffic Solution</h3>
                        <p className="text-gray-500 text-sm">Everything you need to rank and get traffic on autopilot</p>
                    </div>

                    <div className="space-y-6">
                        {/* Feature 1 - Rank on Google & AI Search */}
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded shadow-sm mr-4 text-blue-600">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Rank on Google & AI Search</h4>
                                <p className="text-gray-500 text-xs mt-1">Optimized to rank on Google, ChatGPT, and AI engines</p>
                            </div>
                        </div>

                        {/* Feature 2 - Daily Article Generation */}
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded shadow-sm mr-4 text-blue-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Daily Article Generation</h4>
                                <p className="text-gray-500 text-xs mt-1">SEO-optimized content generated daily with internal linking</p>
                            </div>
                        </div>

                        {/* Feature 3 - Auto-Publish */}
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded shadow-sm mr-4 text-blue-600">
                                <Puzzle size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Auto-Publish to Your Website</h4>
                                <p className="text-gray-500 text-xs mt-1">Seamless publishing to WordPress, Webflow, and Shopify</p>
                            </div>
                        </div>

                        {/* Feature 4 - Personalized Plan */}
                        <div className="flex items-start">
                            <div className="flex-shrink-0 bg-white p-2 rounded shadow-sm mr-4 text-blue-600">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">Personalized Plan</h4>
                                <p className="text-gray-500 text-xs mt-1">Tailored strategy with keyword ideas and content roadmap</p>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default OnboardingLayout;
