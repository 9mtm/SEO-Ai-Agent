import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AddDomain from '../../components/domains/AddDomain';
import { useFetchDomains } from '../../services/domains';

const Keywords: NextPage = () => {
    const router = useRouter();
    const [showAddDomain, setShowAddDomain] = useState(false);
    const { data: domainsData } = useFetchDomains(router);
    const domains = domainsData?.domains || [];

    return (
        <DashboardLayout
            domains={domains}
            showAddModal={() => setShowAddDomain(true)}
        >
            <Head>
                <title>Keywords - SEO AI Agent</title>
            </Head>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Global Keywords View</h1>
                <p className="text-gray-500 max-w-md mb-8">
                    View and manage all your tracked keywords across all domains in one place.
                    Select a domain from the dropdown above to view specific keywords.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                    {domains.map((domain: DomainType) => (
                        <button
                            key={domain.slug}
                            onClick={() => router.push(`/domain/${domain.slug}`)}
                            className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
                                <span className="font-bold text-gray-500 group-hover:text-blue-600 text-lg uppercase">
                                    {domain.domain.charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">{domain.domain}</h3>
                                <p className="text-xs text-gray-500">View Keywords &rarr;</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <CSSTransition in={showAddDomain} timeout={300} classNames="modal_anim" unmountOnExit mountOnEnter>
                <AddDomain closeModal={() => setShowAddDomain(false)} domains={domains} />
            </CSSTransition>
        </DashboardLayout>
    );
};

export default Keywords;
