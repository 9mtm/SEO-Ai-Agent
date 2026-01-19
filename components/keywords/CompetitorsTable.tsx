import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import { useRefreshCompetitors } from '../../services/competitors';
import { useDeleteKeywords } from '../../services/keywords';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import Modal from '../common/Modal';
import TableSkeleton from '../common/TableSkeleton';
import { useLanguage } from '../../context/LanguageContext';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import KeywordFilter from './KeywordFilter';
import { filterKeywords, keywordsByDevice, sortKeywords } from '../../utils/client/sortFilter';

type CompetitorsTableProps = {
    domain: DomainType | null;
    keywords: KeywordType[];
    isPending: boolean;
    isConsoleIntegrated?: boolean;
    settings?: SettingsType;
};

const CompetitorsTable = ({ domain, keywords, isPending, isConsoleIntegrated, settings }: CompetitorsTableProps) => {
    const { t } = useLanguage();
    const titleColumnRef = useRef(null);
    const { mutate: refreshCompetitorsMutate } = useRefreshCompetitors(() => { });
    const { mutate: deleteMutate } = useDeleteKeywords(() => { });
    const [device, setDevice] = useState<string>('desktop');
    const [filterParams, setFilterParams] = useState<KeywordFilters>({ countries: [], tags: [], search: '' });
    const [sortBy, setSortBy] = useState<string>('date_asc');

    const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
    const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
    const [SCListHeight, setSCListHeight] = useState(500);
    const [maxTitleColumnWidth, setMaxTitleColumnWidth] = useState(235);
    const [isMobile] = useIsMobile();

    const competitors = Array.isArray(domain?.competitors) ? domain.competitors : [];

    useWindowResize(() => {
        // setSCListHeight(window.innerHeight - (isMobile ? 200 : 400)); // Removed for auto-height
        if (titleColumnRef.current) {
            setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
        }
    });

    useEffect(() => {
        if (titleColumnRef.current) {
            setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
        }
    }, [titleColumnRef]);

    const allDomainTags: string[] = useMemo(() => {
        return keywords.reduce((acc: string[], keyword) => [...acc, ...keyword.tags], [])
            .filter((t) => t && t.trim() !== '')
            .filter((value, index, self) => self.indexOf(value) === index);
    }, [keywords]);

    // Show only keywords that are being tracked for competitors or have competitor data
    const baseKeywords = useMemo(() => {
        if (!keywords) return [];
        return keywords.filter(k =>
            k.updating_competitors === true ||
            (k.competitor_positions && Object.keys(k.competitor_positions).length > 0)
        );
    }, [keywords]);

    const processedKeywords = useMemo(() => {
        const devKeywords = baseKeywords.filter(k => k.device === device);
        const filtered = filterKeywords(devKeywords, filterParams);
        return sortKeywords(filtered, sortBy, 'threeDays'); // Default sort context
    }, [baseKeywords, device, filterParams, sortBy]);

    const selectKeyword = (keywordID: number) => {
        let updatedSelected = [...selectedKeywords, keywordID];
        if (selectedKeywords.includes(keywordID)) {
            updatedSelected = selectedKeywords.filter((keyID) => keyID !== keywordID);
        }
        setSelectedKeywords(updatedSelected);
    };

    const handleRefreshKeyword = (keywordId: number) => {
        if (domain) {
            refreshCompetitorsMutate({ domain: domain.domain, keywordId });
        }
    };

    const handleRefreshSelected = () => {
        selectedKeywords.forEach(keywordId => {
            if (domain) {
                refreshCompetitorsMutate({ domain: domain.domain, keywordId });
            }
        });
        setSelectedKeywords([]);
    };

    const Row = ({ data, index, style }: ListChildComponentProps) => {
        const keyword = data[index];
        const competitorPositions = keyword.competitor_positions || {};
        const isSelected = selectedKeywords.includes(keyword.ID);
        const [showOptions, setShowOptions] = useState(false);
        const dropdownRef = useRef(null);
        useOnClickOutside(dropdownRef, () => setShowOptions(false));
        const optionsButtonStyle = 'block px-2 py-2 cursor-pointer hover:bg-indigo-50 hover:text-blue-700';

        return (
            <div
                key={keyword.ID}
                style={style}
                className={`keyword relative py-5 px-4 text-gray-600 border-b-[1px] border-gray-200 lg:py-4 lg:px-6 lg:border-0 
                    lg:flex lg:justify-between lg:items-center ${isSelected ? ' bg-indigo-50 keyword--selected' : ''} 
                    ${index === data.length - 1 ? 'border-b-0' : ''}`}
            >
                <div className='w-3/4 font-semibold cursor-pointer lg:flex-1 lg:shrink-0 lg:basis-28 lg:w-auto lg:flex lg:items-center'>
                    <button
                        className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border 
                            ${isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                        onClick={() => selectKeyword(keyword.ID)}
                    >
                        <Icon type="check" size={10} />
                    </button>
                    <a
                        style={{ maxWidth: `${maxTitleColumnWidth - 35}px` }}
                        className={'py-2 hover:text-blue-600 lg:flex lg:items-center w-full'}
                        title={keyword.keyword}
                    >
                        <span className={`fflag fflag-${keyword.country} w-[18px] h-[12px] mr-2`} title={countries[keyword.country][0]} />
                        <span className='inline-block text-ellipsis overflow-hidden whitespace-nowrap w-[calc(100%-50px)]'>
                            {keyword.keyword}{keyword.city ? ` (${keyword.city})` : ''}
                        </span>
                    </a>
                </div>

                <div className='keyword_position absolute bg-[#f8f9ff] w-fit min-w-[50px] h-12 p-2 text-base mt-[-20px] rounded right-5 lg:relative
                    lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-32 lg:grow-0 lg:right-0 text-center font-semibold'>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${keyword.position > 0 && keyword.position <= 10
                        ? 'bg-green-100 text-green-800'
                        : keyword.position > 10 && keyword.position <= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                        {keyword.position > 0 ? keyword.position : '-'}
                    </span>
                </div>

                {competitors.map((competitor: string, idx: number) => {
                    const cleanCompetitor = competitor.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    const position = competitorPositions[cleanCompetitor] || 0;

                    return (
                        <div key={idx} className='hidden bg-[#f8f9ff] w-fit min-w-[50px] h-12 p-2 text-base mt-[-20px] rounded right-5 lg:relative lg:block
                            lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-32 lg:grow-0 lg:right-0 text-center'>
                            {keyword.updating_competitors ? (
                                <Icon type="loading" size={14} />
                            ) : (
                                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${position > 0 && position <= 10
                                    ? 'bg-blue-100 text-blue-800'
                                    : position > 10 && position <= 50
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {position > 0 ? position : '-'}
                                </span>
                            )}
                        </div>
                    );
                })}

                <div ref={dropdownRef} className='absolute right-4 mt-[-10px] top-2 lg:flex-1 lg:basis-5 lg:grow-0 lg:shrink-0 lg:relative lg:right-[-10px]'>
                    <button
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${showOptions ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setShowOptions(!showOptions)}
                    >
                        <Icon type="dots" size={16} />
                    </button>
                    {showOptions && (
                        <ul className='keyword_options customShadow absolute w-[160px] right-0 bg-white rounded-xl border border-gray-100/50 shadow-xl z-20 py-1 overflow-hidden'>
                            <li>
                                <a className='flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 cursor-pointer transition-colors'
                                    onClick={() => { handleRefreshKeyword(keyword.ID); setShowOptions(false); }}>
                                    <Icon type="reload" size={14} classes="text-indigo-500" /> {t('trackingTable.refresh')}
                                </a>
                            </li>
                            <div className="h-[1px] bg-gray-50 my-1"></div>
                            <li>
                                <a className='flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer transition-colors'
                                    onClick={() => { setSelectedKeywords([keyword.ID]); setShowRemoveModal(true); setShowOptions(false); }}>
                                    <Icon type="trash" size={14} classes="text-red-500" /> {t('trackingTable.remove')}
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        );
    };

    const selectedAllItems = selectedKeywords.length === processedKeywords.length && processedKeywords.length > 0;

    if (!keywords || keywords.length === 0) {
        return (
            <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
                <div className='p-9 pt-[5%] text-center text-gray-500 flex flex-col items-center justify-center min-h-[250px]'>
                    <Icon type="info" size={48} color="#999" />
                    <p className="mt-4 mb-6 text-gray-600 font-medium">{t('trackingTable.noKeywordsMsg')}</p>

                    {(!competitors || competitors.length === 0) && (domain && (domain.slug || domain.domain)) && (
                        <Link
                            href={`/domain/settings/${domain.slug || domain.domain}?tab=competitors`}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            <Plus size={16} color="#fff" />
                            {t('tracking.manageCompetitors.add') || 'Add Competitors'}
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    if (!competitors || competitors.length === 0) {
        return (
            <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
                <div className='p-9 pt-[5%] text-center text-gray-500 flex flex-col items-center justify-center min-h-[250px]'>
                    <Icon type="users" size={48} color="#999" />
                    <p className="mt-4 mb-6 text-gray-600 font-medium">{t('trackingTable.noCompetitorsMsg')}</p>
                    {(domain && (domain.slug || domain.domain)) && (
                        <Link
                            href={`/domain/settings/${domain.slug || domain.domain}?tab=competitors`}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            <Plus size={16} color="#fff" />
                            {t('tracking.manageCompetitors.add') || 'Add Competitors'}
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className='domKeywords flex flex-col bg-white rounded-xl text-sm border border-gray-100 mb-5 shadow-xl shadow-gray-200/40 relative'>
                {baseKeywords.length > 0 && (
                    <KeywordFilter
                        device={device}
                        allTags={allDomainTags}
                        setDevice={setDevice}
                        filterParams={filterParams}
                        filterKeywords={setFilterParams}
                        keywords={baseKeywords}
                        updateSort={setSortBy}
                        sortBy={sortBy}
                        integratedConsole={isConsoleIntegrated}
                        tableColumns={[]}
                    />
                )}
                {selectedKeywords.length > 0 && (
                    <div className='flex items-center gap-4 py-3 px-6 bg-indigo-50/50 border-b border-indigo-100 rounded-t-xl'>
                        <span className='text-xs font-bold uppercase tracking-wider text-indigo-400'>{selectedKeywords.length} {t('trackingTable.selected')}</span>
                        <div className="h-4 w-[1px] bg-indigo-200"></div>
                        <div className='flex items-center gap-2'>
                            <button
                                className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-indigo-100 text-xs font-semibold text-indigo-600 shadow-sm hover:shadow hover:bg-indigo-50 transition-all'
                                onClick={handleRefreshSelected}
                            >
                                <Icon type="reload" size={12} classes="text-indigo-500" /> {t('trackingTable.refresh')}
                            </button>
                            <button
                                className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-red-100 text-xs font-semibold text-red-600 shadow-sm hover:shadow hover:bg-red-50 transition-all'
                                onClick={() => setShowRemoveModal(true)}
                            >
                                <Icon type="trash" size={12} classes="text-red-500" /> {t('trackingTable.remove')}
                            </button>
                        </div>
                    </div>
                )}
                <div className='domkeywordsTable domkeywordsTable--keywords w-full'>
                    <div className='w-full'>
                        <div className='domKeywords_head domKeywords_head--competitors hidden lg:flex p-3 px-6 bg-white/95 backdrop-blur-md sticky top-0 z-30
                         text-gray-500 justify-between items-center font-bold text-xs uppercase tracking-wider border-y border-gray-100 shadow-sm'>
                            <span ref={titleColumnRef} className='domKeywords_head_keyword flex-1 basis-[4rem] w-auto lg:flex-1 lg:basis-20 lg:w-auto lg:flex lg:items-center'>
                                {processedKeywords.length > 0 && (
                                    <button
                                        className={`p-0 mr-2 leading-[0px] inline-block rounded-sm pt-0 px-[1px] pb-[3px] border border-slate-300 
                                            ${selectedAllItems ? 'bg-blue-700 border-blue-700 text-white' : 'text-transparent'}`}
                                        onClick={() => setSelectedKeywords(selectedAllItems ? [] : processedKeywords.map((k: KeywordType) => k.ID))}
                                    >
                                        <Icon type="check" size={10} />
                                    </button>
                                )}
                                <span className='inline-block lg:flex lg:items-center lg:max-w-[235px]'>
                                    {t('trackingTable.keyword')}
                                </span>
                            </span>
                            <span className='domKeywords_head_position flex-1 basis-32 grow-0 text-center'>
                                {t('trackingTable.yourPosition')}
                            </span>
                            {competitors.map((competitor: string, index: number) => (
                                <span key={index} className='flex-1 basis-32 grow-0 text-center truncate px-2 normal-case' title={competitor}>
                                    {competitor.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')}
                                </span>
                            ))}
                            <span className='flex-1 basis-5 grow-0 shrink-0'></span>
                        </div>
                        <div className='domKeywords_keywords border-gray-200 min-h-[55vh] relative'>
                            {processedKeywords && processedKeywords.length > 0 && (
                                <List
                                    innerElementType="div"
                                    itemData={processedKeywords}
                                    itemCount={processedKeywords.length}
                                    itemSize={isMobile ? 146 : 57}
                                    height={Math.max(processedKeywords.length * (isMobile ? 146 : 57), 400)}
                                    width={'100%'}
                                    className={'styled-scrollbar'}
                                >
                                    {Row}
                                </List>
                            )}
                            {!isPending && processedKeywords.length === 0 && (
                                <p className='p-9 pt-[10%] text-center text-gray-500'>{t('trackingTable.noKeywordsDevice')}</p>
                            )}
                            {isPending && (
                                <TableSkeleton rows={8} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showRemoveModal && selectedKeywords.length > 0 && (
                <Modal closeModal={() => { setSelectedKeywords([]); setShowRemoveModal(false); }} title={t('trackingTable.removeTitle')}>
                    <div className='text-sm'>
                        <p>{t('trackingTable.removeConfirm', { count: selectedKeywords.length > 1 ? selectedKeywords.length : '' })}</p>
                        <div className='mt-6 text-right font-semibold'>
                            <button
                                className='py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                                onClick={() => { setSelectedKeywords([]); setShowRemoveModal(false); }}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className='py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                                onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); setSelectedKeywords([]); }}
                            >
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CompetitorsTable;
