import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DomainHeader from '../../../components/domains/DomainHeader';
import KeywordsTable from '../../../components/keywords/KeywordsTable';


import exportCSV from '../../../utils/client/exportcsv';
import { useFetchDomains } from '../../../services/domains';
import { useFetchKeywords } from '../../../services/keywords';
import { useFetchSettings } from '../../../services/settings';
import AddKeywords from '../../../components/keywords/AddKeywords';
import CompetitorsTable from '../../../components/keywords/CompetitorsTable';
import ManageCompetitors from '../../../components/domains/ManageCompetitors';
import { useRefreshCompetitors } from '../../../services/competitors';
import toast, { Toaster } from 'react-hot-toast';

const SingleDomain: NextPage = () => {
    const router = useRouter();
    const [showAddKeywords, setShowAddKeywords] = useState(false);
    const [showManageCompetitors, setShowManageCompetitors] = useState(false);
    const [activeTab, setActiveTab] = useState<'keywords' | 'competitors'>('keywords');


    const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined | number>(undefined);
    const { data: appSettingsData, isPending: isAppSettingsLoading } = useFetchSettings();
    const { data: domainsData } = useFetchDomains(router);

    const appSettings: SettingsType = appSettingsData?.settings || {};
    const { scraper_type = '', available_scapers = [] } = appSettings;
    const activeScraper = useMemo(() => available_scapers.find((scraper) => scraper.value === scraper_type), [scraper_type, available_scapers]);

    const activDomain: DomainType | null = useMemo(() => {
        let active: DomainType | null = null;
        if (domainsData?.domains && router.query?.slug) {
            active = domainsData.domains.find((x: DomainType) => x.slug === router.query.slug) || null;
        }
        return active;
    }, [router.query.slug, domainsData]);

    const domainHasScAPI = useMemo(() => {
        const doaminSc = activDomain?.search_console ? JSON.parse(activDomain.search_console) : {};
        return !!(doaminSc?.client_email && doaminSc?.private_key);
    }, [activDomain]);

    const { keywordsData, keywordsLoading } = useFetchKeywords(router, activDomain?.domain || '', setKeywordSPollInterval, keywordSPollInterval);
    const { mutate: refreshCompetitors, isPending: isRefreshing } = useRefreshCompetitors(() => { });
    const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
    const theKeywords: KeywordType[] = keywordsData && keywordsData.keywords;

    const handleRefreshCompetitors = () => {
        if (activDomain) {
            refreshCompetitors({ domain: activDomain.domain });
        }
    };

    return (
        <DashboardLayout
            domains={theDomains}

        >
            {activDomain && activDomain.domain && (
                <Head>
                    <title>{`${activDomain.domain} - SEO AI Agent`}</title>
                </Head>
            )}

            {/* Warnings */}
            {((!scraper_type || (scraper_type === 'none')) && !isAppSettingsLoading) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm text-red-800 font-medium">
                            A Scrapper/Proxy has not been set up yet. Open Settings to set it up and start using the app.
                        </p>
                    </div>
                </div>
            )}

            <div className="domain_keywords">
                {activDomain && activDomain.domain ? (
                    <DomainHeader
                        domain={activDomain}
                        domains={theDomains}
                        showAddModal={setShowAddKeywords}

                        exportCsv={() => exportCSV(theKeywords, activDomain.domain)}
                        onRefreshCompetitors={activeTab === 'competitors' ? handleRefreshCompetitors : undefined}
                        isRefreshingCompetitors={isRefreshing}
                    />
                ) : (
                    <div className='w-full lg:h-[100px]'></div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b border-gray-200">
                    <button
                        className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'keywords'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        onClick={() => setActiveTab('keywords')}
                    >
                        Keywords
                    </button>
                    <button
                        className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'competitors'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        onClick={() => setActiveTab('competitors')}
                    >
                        Competitors
                    </button>
                </div>

                {/* Keywords Tab Content */}
                {activeTab === 'keywords' && (
                    <KeywordsTable
                        isPending={keywordsLoading}
                        domain={activDomain}
                        keywords={theKeywords}
                        showAddModal={showAddKeywords}
                        setShowAddModal={setShowAddKeywords}
                        isConsoleIntegrated={!!(appSettings && appSettings.search_console_integrated) || domainHasScAPI}
                        settings={appSettings}
                    />
                )}

                {/* Competitors Tab Content */}
                {activeTab === 'competitors' && (
                    <CompetitorsTable
                        isPending={keywordsLoading}
                        domain={activDomain}
                        keywords={theKeywords}
                        isConsoleIntegrated={!!(appSettings && appSettings.search_console_integrated) || domainHasScAPI}
                        settings={appSettings}
                    />
                )}
            </div>



            <CSSTransition in={showAddKeywords} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                <AddKeywords
                    domain={activDomain?.domain || ''}
                    scraperName={activeScraper?.label || ''}
                    keywords={theKeywords}
                    allowsCity={!!activeScraper?.allowsCity}
                    closeModal={() => setShowAddKeywords(false)}
                />
            </CSSTransition>

            <CSSTransition in={showManageCompetitors} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                {activDomain && (
                    <ManageCompetitors
                        domain={activDomain}
                        closeModal={() => setShowManageCompetitors(false)}
                    />
                )}
            </CSSTransition>

            <Toaster position='bottom-center' containerClassName="react_toaster" />
        </DashboardLayout>
    );
};

export default SingleDomain;
