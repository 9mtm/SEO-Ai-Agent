import { useEffect } from 'react';
import { useAccessibility } from './useAccessibility';
import Link from 'next/link';

interface AccessibilityPanelProps {
    onClose: () => void;
}

const A11Y_ICON = (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.5 6.5C13.5 7.328 12.828 8 12 8C11.172 8 10.5 7.328 10.5 6.5C10.5 5.672 11.172 5 12 5C12.828 5 13.5 5.672 13.5 6.5Z" fill="currentColor"/>
        <path d="M6.051 8.684C5.877 9.208 6.16 9.774 6.684 9.949C6.859 10.007 7.036 10.061 7.213 10.114C7.536 10.211 7.989 10.341 8.507 10.47C9.089 10.616 9.781 10.769 10.478 10.873C10.432 11.765 10.321 12.406 10.217 12.831L8.106 17.053C7.859 17.547 8.059 18.148 8.553 18.395C9.047 18.642 9.647 18.441 9.894 17.947L12 13.736L14.106 17.947C14.353 18.441 14.953 18.642 15.447 18.395C15.941 18.148 16.141 17.547 15.894 17.053L13.783 12.831C13.68 12.406 13.568 11.765 13.522 10.873C14.219 10.769 14.911 10.616 15.493 10.47C16.011 10.341 16.464 10.211 16.787 10.114C16.963 10.062 17.138 10.008 17.313 9.95C17.826 9.78 18.12 9.198 17.949 8.684C17.774 8.16 17.208 7.877 16.684 8.052C16.528 8.103 16.37 8.151 16.213 8.199C15.911 8.289 15.489 8.41 15.008 8.53C14.022 8.777 12.871 9 12 9C11.129 9 9.978 8.777 8.993 8.53C8.511 8.41 8.089 8.289 7.787 8.199C7.632 8.152 7.476 8.104 7.322 8.053C6.802 7.882 6.225 8.162 6.051 8.684Z" fill="currentColor"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M23 12C23 18.075 18.075 23 12 23C5.925 23 1 18.075 1 12C1 5.925 5.925 1 12 1C18.075 1 23 5.925 23 12ZM3.007 12C3.007 16.967 7.033 20.993 12 20.993C16.967 20.993 20.993 16.967 20.993 12C20.993 7.033 16.967 3.007 12 3.007C7.033 3.007 3.007 7.033 3.007 12Z" fill="currentColor"/>
    </svg>
);

export default function AccessibilityPanel({ onClose }: AccessibilityPanelProps) {
    const { settings, updateSetting, resetSettings } = useAccessibility();

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Reading mask mouse tracking
    useEffect(() => {
        if (!settings.readingMask) return;
        const mask = document.getElementById('accessibility-reading-mask');
        if (!mask) return;
        const handleMouseMove = (e: MouseEvent) => {
            mask.style.background = `radial-gradient(circle 100px at ${e.clientX}px ${e.clientY}px, transparent 0%, rgba(0, 0, 0, 0.7) 100%)`;
            mask.style.display = 'block';
        };
        document.addEventListener('mousemove', handleMouseMove);
        return () => document.removeEventListener('mousemove', handleMouseMove);
    }, [settings.readingMask]);

    const fontSizeOptions = [
        { value: 0.875 }, { value: 1 }, { value: 1.125 }, { value: 1.25 }, { value: 1.5 },
    ];
    const lineHeightOptions = [
        { value: 1.2, label: '1.2x' }, { value: 1.5, label: '1.5x' }, { value: 2, label: '2x' }, { value: 2.5, label: '2.5x' },
    ];

    const ToggleButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
        <button onClick={onClick} className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${active ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
            <div className="text-blue-600">{icon}</div>
            <span className="text-xs text-gray-600">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[9999]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-labelledby="accessibility-panel-title">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {A11Y_ICON}
                        <h2 id="accessibility-panel-title" className="text-lg font-bold">Accessibility</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={resetSettings} className="p-2 hover:bg-white/20 rounded transition-colors" aria-label="Reset settings">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded transition-colors" aria-label="Close">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Content Adjustments */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Content Adjustments</h3>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button onClick={() => {
                                const idx = fontSizeOptions.findIndex(o => o.value === settings.fontSize);
                                updateSetting('fontSize', fontSizeOptions[(idx + 1) % fontSizeOptions.length].value);
                            }} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${settings.fontSize !== 1 ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="text-xl font-bold text-blue-600">T<span className="text-xs">t</span></div>
                                <span className="text-xs text-gray-600">Bigger Text</span>
                            </button>

                            <button onClick={() => {
                                const idx = lineHeightOptions.findIndex(o => o.value === settings.lineHeight);
                                updateSetting('lineHeight', lineHeightOptions[(idx + 1) % lineHeightOptions.length].value);
                            }} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${settings.lineHeight !== 1.5 ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                <span className="text-xs text-gray-600">Line Height</span>
                            </button>

                            <button onClick={() => {
                                const aligns: ('left' | 'center' | 'justify')[] = ['left', 'center', 'justify'];
                                const idx = aligns.indexOf(settings.textAlign);
                                updateSetting('textAlign', aligns[(idx + 1) % aligns.length]);
                            }} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${settings.textAlign !== 'left' ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                                <span className="text-xs text-gray-600">Text Align</span>
                            </button>

                            <button onClick={() => updateSetting('readableFont', !settings.readableFont)} className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${settings.readableFont ? 'bg-blue-50 border-2 border-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="text-xl font-bold text-blue-600">Aa</div>
                                <span className="text-xs text-gray-600">Readable Font</span>
                            </button>
                        </div>
                    </div>

                    {/* Orientation Adjustments */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Orientation Adjustments</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <ToggleButton active={settings.pageStructure} onClick={() => updateSetting('pageStructure', !settings.pageStructure)} label="Page Structure" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                            } />
                            <ToggleButton active={settings.readingMask} onClick={() => updateSetting('readingMask', !settings.readingMask)} label="Reading Mask" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            } />
                            <ToggleButton active={settings.hideImages} onClick={() => updateSetting('hideImages', !settings.hideImages)} label="Hide Images" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            } />
                            <ToggleButton active={settings.stopAnimations} onClick={() => updateSetting('stopAnimations', !settings.stopAnimations)} label="Pause Animations" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            } />
                            <ToggleButton active={settings.highlightLinks} onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)} label="Highlight Links" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            } />
                            <ToggleButton active={settings.outlineFocus} onClick={() => updateSetting('outlineFocus', !settings.outlineFocus)} label="Outline Focus" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                            } />
                        </div>
                    </div>

                    {/* Color Adjustments */}
                    <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Color Adjustments</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <ToggleButton active={settings.monochrome} onClick={() => updateSetting('monochrome', !settings.monochrome)} label="Greyscale" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                            } />
                            <ToggleButton active={settings.highContrast} onClick={() => updateSetting('highContrast', !settings.highContrast)} label="High Contrast" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            } />
                            <ToggleButton active={settings.largeCursor} onClick={() => updateSetting('largeCursor', !settings.largeCursor)} label="Large Cursor" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" /></svg>
                            } />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <span>Powered by</span>
                        <a href="https://dpro.at" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-blue-600 transition-colors">Dpro GmbH</a>
                    </div>
                    <Link href="/privacy" className="hover:text-blue-600 transition-colors" onClick={onClose}>Privacy Policy</Link>
                </div>
            </div>
        </div>
    );
}
