import { useState, useEffect } from 'react';

export interface AccessibilitySettings {
    fontSize: number;
    lineHeight: number;
    textAlign: 'left' | 'center' | 'justify';
    readableFont: boolean;
    highlightLinks: boolean;
    largeCursor: boolean;
    readingMask: boolean;
    stopAnimations: boolean;
    highContrast: boolean;
    monochrome: boolean;
    hideImages: boolean;
    outlineFocus: boolean;
    pageStructure: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
    fontSize: 1,
    lineHeight: 1.5,
    textAlign: 'left',
    readableFont: false,
    highlightLinks: false,
    largeCursor: false,
    readingMask: false,
    stopAnimations: false,
    highContrast: false,
    monochrome: false,
    hideImages: false,
    outlineFocus: false,
    pageStructure: false,
};

const STORAGE_KEY = 'seoagent_accessibility_settings';

function applySettings(settings: AccessibilitySettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.style.fontSize = `${settings.fontSize * 100}%`;
    root.style.lineHeight = `${settings.lineHeight}`;

    if (settings.textAlign !== 'left') {
        root.style.textAlign = settings.textAlign;
    } else {
        root.style.textAlign = 'left';
    }

    const toggleClass = (name: string, active: boolean) => {
        if (active) root.classList.add(name);
        else root.classList.remove(name);
    };

    toggleClass('accessibility-readable-font', settings.readableFont);
    toggleClass('accessibility-highlight-links', settings.highlightLinks);
    toggleClass('accessibility-large-cursor', settings.largeCursor);
    toggleClass('accessibility-stop-animations', settings.stopAnimations);
    toggleClass('accessibility-high-contrast', settings.highContrast);
    toggleClass('accessibility-monochrome', settings.monochrome);
    toggleClass('accessibility-hide-images', settings.hideImages);
    toggleClass('accessibility-outline-focus', settings.outlineFocus);
    toggleClass('accessibility-page-structure', settings.pageStructure);

    // Reading mask overlay
    if (settings.readingMask) {
        toggleClass('accessibility-reading-mask', true);
        if (!document.getElementById('accessibility-reading-mask')) {
            const mask = document.createElement('div');
            mask.id = 'accessibility-reading-mask';
            mask.className = 'accessibility-reading-mask-overlay';
            document.body.appendChild(mask);
        }
    } else {
        toggleClass('accessibility-reading-mask', false);
        const mask = document.getElementById('accessibility-reading-mask');
        if (mask) mask.remove();
    }
}

function saveSettings(settings: AccessibilitySettings) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

export function useAccessibility() {
    const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                setSettings(merged);
                applySettings(merged);
            }
        } catch {}
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            applySettings(settings);
            saveSettings(settings);
        }
    }, [settings, isInitialized]);

    const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        applySettings(DEFAULT_SETTINGS);
        localStorage.removeItem(STORAGE_KEY);
    };

    const hasActiveSettings = Object.keys(settings).some(key => {
        const val = settings[key as keyof AccessibilitySettings];
        const def = DEFAULT_SETTINGS[key as keyof AccessibilitySettings];
        if (key === 'fontSize' && val !== 1) return true;
        if (key === 'lineHeight' && val !== 1.5) return true;
        if (key === 'textAlign' && val !== 'left') return true;
        if (typeof val === 'boolean' && val !== def) return true;
        return false;
    });

    return { settings, updateSetting, resetSettings, isInitialized, hasActiveSettings };
}
