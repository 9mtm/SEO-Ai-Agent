import React, { useMemo, useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import { AlertCircle } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DomainHeader from '../../../components/domains/DomainHeader';
import CompetitorsTable from '../../../components/keywords/CompetitorsTable';
import AddDomain from '../../../components/domains/AddDomain';

import ManageCompetitors from '../../../components/domains/ManageCompetitors';
import { useFetchDomains } from '../../../services/domains';
import { useFetchKeywords } from '../../../services/keywords';
import { useRefreshCompetitors } from '../../../services/competitors';
import { useFetchSettings } from '../../../services/settings';

const CompetitorsPage: NextPage = () => {
    const router = useRouter();
    const [showAddDomain, setShowAddDomain] = useState(false);

    const [showManageCompetitors, setShowManageCompetitors] = useState(false);
    const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined | number>(undefined);
    const { data: appSettingsData, isPending: isAppSettingsLoading } = useFetchSettings();
    const { data: domainsData } = useFetchDomains(router);

    const appSettings: SettingsType = appSettingsData?.settings || {};
    const { scraper_type = '' } = appSettings;

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

    useEffect(() => {
        if (isRefreshing) {
            setKeywordSPollInterval(1000);
        } else {
            setKeywordSPollInterval(undefined);
        }
    }, [isRefreshing]);



    const handleRefreshCompetitors = () => {
        if (activDomain) {
            refreshCompetitors({ domain: activDomain.domain });
        }
    };

    return (
        <DashboardLayout
            domains={theDomains}
            showAddModal={() => setShowAddDomain(true)}
        >
            {activDomain && activDomain.domain && (
                <Head>
                    <title>{`${activDomain.domain} - Competitors - SEO AI Agent`}</title>
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
                        showAddModal={() => setShowManageCompetitors(true)}

                        exportCsv={() => { }}

                        onRefreshCompetitors={handleRefreshCompetitors}
                        isRefreshingCompetitors={isRefreshing}
                    />
                ) : (
                    <div className='w-full lg:h-[100px]'></div>
                )}
                <CompetitorsTable
                    isPending={keywordsLoading}
                    domain={activDomain}
                    keywords={theKeywords}
                    isConsoleIntegrated={!!(appSettings && appSettings.search_console_integrated) || domainHasScAPI}
                    settings={appSettings}
                />
            </div>

            <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
            </CSSTransition>



            <CSSTransition in={showManageCompetitors} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                {activDomain && (
                    <ManageCompetitors
                        domain={activDomain}
                        closeModal={() => setShowManageCompetitors(false)}
                    />
                )}
            </CSSTransition>
        </DashboardLayout>
    );
};

export default CompetitorsPage;
