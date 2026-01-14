import Link from 'next/link';
import { useRouter } from 'next/router';
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import AccountMenu from './AccountMenu';

type TopbarProps = {
   showAddModal: Function,
   domains?: DomainType[],
   currentDomain?: DomainType | null,
}

const TopBar = ({ showAddModal, domains = [], currentDomain }: TopbarProps) => {
   const router = useRouter();
   const isDomainsPage = router.pathname === '/domains';

   return (
      <div className={`topbar flex w-full mx-auto justify-between 
       ${isDomainsPage ? 'max-w-5xl lg:justify-between' : 'max-w-7xl lg:justify-end'}  bg-white lg:bg-transparent`}>
         <h3 className={`p-4 text-base font-bold text-blue-700 ${isDomainsPage ? 'lg:pl-0' : 'lg:hidden'}`}>
            <img src="/dpro_logo.png" alt="Dpro" className="inline-block h-6 mr-2" />
            <span className="align-middle text-blue-700">Dpro</span>
         </h3>
         {!isDomainsPage && router.asPath !== '/research' && (
            <Link href={'/domains'} className=' right-14 top-2 px-2 py-1 cursor-pointer bg-[#ecf2ff] hover:bg-indigo-100 transition-all
            absolute lg:top-3 lg:right-auto lg:left-8 lg:px-3 lg:py-2 rounded-full' >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
            </Link>
         )}
         <div className="topbar__right flex items-center p-3">
            <AccountMenu
               showAddModal={() => showAddModal()}
               domains={domains}
               currentDomain={currentDomain}
            />
         </div>
      </div>
   );
};

export default TopBar;
