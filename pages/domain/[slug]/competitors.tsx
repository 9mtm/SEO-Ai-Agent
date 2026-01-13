import React, { useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CSSTransition } from 'react-transition-group';
import Sidebar from '../../../components/common/Sidebar';
import TopBar from '../../../components/common/TopBar';
import DomainHeader from '../../../components/domains/DomainHeader';
import CompetitorsTable from '../../../components/keywords/CompetitorsTable';
import AddDomain from '../../../components/domains/AddDomain';
import DomainSettings from '../../../components/domains/DomainSettings';
import ManageCompetitors from '../../../components/domains/ManageCompetitors';
import Settings from '../../../components/settings/Settings';
import { useFetchDomains, useDeleteDomain } from '../../../services/domains';
import { useFetchKeywords } from '../../../services/keywords';
import { useRefreshCompetitors } from '../../../services/competitors';
import { useFetchSettings } from '../../../services/settings';
import Footer from '../../../components/common/Footer';

const CompetitorsPage: NextPage = () => {
    const router = useRouter();
    const [showAddDomain, setShowAddDomain] = useState(false);
    const [showDomainSettings, setShowDomainSettings] = useState(false);
    const [showManageCompetitors, setShowManageCompetitors] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [keywordSPollInterval, setKeywordSPollInterval] = useState<undefined | number>(undefined);
    const { data: appSettingsData, isPending: isAppSettingsLoading } = useFetchSettings();
    const { data: domainsData } = useFetchDomains(router);
    const { mutate: deleteDomainMutate } = useDeleteDomain(() => {
        router.push('/');
    });
    const appSettings: SettingsType = appSettingsData?.settings || {};
    const { scraper_type = '' } = appSettings;

    const activDomain: DomainType | null = useMemo(() => {
        let active: DomainType | null = null;
        if (domainsData?.domains && router.query?.slug) {
            active = domainsData.domains.find((x: DomainType) => x.slug === router.query.slug) || null;
        }
        return active;
    }, [router.query.slug, domainsData]);

    const { keywordsData, keywordsLoading } = useFetchKeywords(router, activDomain?.domain || '', setKeywordSPollInterval, keywordSPollInterval);
    const theDomains: DomainType[] = (domainsData && domainsData.domains) || [];
    const theKeywords: KeywordType[] = keywordsData && keywordsData.keywords;
    const { mutate: refreshCompetitorsMutate } = useRefreshCompetitors(() => { });

    const handleDeleteDomain = () => {
        if (activDomain && window.confirm(`Are you sure you want to delete ${activDomain.domain}?`)) {
            deleteDomainMutate(activDomain);
        }
    };

    return (
        <div className="Domain ">
            {((!scraper_type || (scraper_type === 'none')) && !isAppSettingsLoading) && (
                <div className=' p-3 bg-red-600 text-white text-sm text-center'>
                    A Scrapper/Proxy has not been set up Yet. Open Settings to set it up and start using the app.
                </div>
            )}
            {activDomain && activDomain.domain
                && <Head>
                    <title>{`${activDomain.domain} - SEO AI Agent`} </title>
                </Head>
            }
            <TopBar showSettings={() => setShowSettings(true)} showAddModal={() => setShowAddDomain(true)} />
            <div className="flex w-full max-w-7xl mx-auto">
                <Sidebar domains={theDomains} showAddModal={() => setShowAddDomain(true)} />
                <div className="domain_kewywords px-5 pt-10 lg:px-0 lg:pt-8 w-full">
                    {activDomain && activDomain.domain
                        ? <DomainHeader
                            domain={activDomain}
                            domains={theDomains}
                            showAddModal={() => setShowManageCompetitors(true)}
                            showSettingsModal={setShowDomainSettings}
                            exportCsv={() => refreshCompetitorsMutate(activDomain.domain)}
                            onDeleteDomain={handleDeleteDomain}
                        />
                        : <div className='w-full lg:h-[100px]'></div>
                    }
                    <CompetitorsTable
                        isPending={keywordsLoading}
                        domain={activDomain}
                        keywords={theKeywords}
                    />
                </div>
            </div>

            <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                <AddDomain closeModal={() => setShowAddDomain(false)} domains={domainsData?.domains || []} />
            </CSSTransition>

            <CSSTransition in={showDomainSettings} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                <DomainSettings
                    domain={showDomainSettings && theDomains && activDomain && activDomain.domain ? activDomain : false}
                    closeModal={setShowDomainSettings}
                />
            </CSSTransition>

            <CSSTransition in={showManageCompetitors} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                {activDomain && <ManageCompetitors domain={activDomain} closeModal={() => setShowManageCompetitors(false)} />}
            </CSSTransition>

            <CSSTransition in={showSettings} timeout={300} classNames="settings_anim" unmountOnExit mountOnEnter>
                <Settings closeSettings={() => setShowSettings(false)} />
            </CSSTransition>
            <Footer currentVersion={appSettings?.version ? appSettings.version : ''} />
        </div>
    );
};

export default CompetitorsPage;
