import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import Icon from '../common/Icon';
import countries from '../../utils/countries';
import { useRefreshCompetitors } from '../../services/competitors';
import { useDeleteKeywords } from '../../services/keywords';
import useWindowResize from '../../hooks/useWindowResize';
import useIsMobile from '../../hooks/useIsMobile';
import Modal from '../common/Modal';

type CompetitorsTableProps = {
    domain: DomainType | null;
    keywords: KeywordType[];
    isPending: boolean;
    isConsoleIntegrated?: boolean;
    settings?: SettingsType;
};

const CompetitorsTable = ({ domain, keywords, isPending, isConsoleIntegrated, settings }: CompetitorsTableProps) => {
    const titleColumnRef = useRef(null);
    const { mutate: refreshCompetitorsMutate } = useRefreshCompetitors(() => { });
    const { mutate: deleteMutate } = useDeleteKeywords(() => { });
    const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
    const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);
    const [SCListHeight, setSCListHeight] = useState(500);
    const [maxTitleColumnWidth, setMaxTitleColumnWidth] = useState(235);
    const [isMobile] = useIsMobile();

    const competitors = Array.isArray(domain?.competitors) ? domain.competitors : [];

    useWindowResize(() => {
        setSCListHeight(window.innerHeight - (isMobile ? 200 : 400));
        if (titleColumnRef.current) {
            setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
        }
    });

    useEffect(() => {
        if (titleColumnRef.current) {
            setMaxTitleColumnWidth((titleColumnRef.current as HTMLElement).clientWidth);
        }
    }, [titleColumnRef]);

    // Show all keywords (no device filtering)
    const processedKeywords = useMemo(() => {
        return keywords || [];
    }, [keywords]);

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
                    lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-24 lg:grow-0 lg:right-0 text-center font-semibold'>
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
                            lg:bg-transparent lg:w-auto lg:h-auto lg:mt-0 lg:p-0 lg:text-sm lg:flex-1 lg:basis-24 lg:grow-0 lg:right-0 text-center'>
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

                <div className='absolute right-4 mt-[-10px] top-2 lg:flex-1 lg:basis-5 lg:grow-0 lg:shrink-0 lg:relative lg:right-[-10px]'>
                    <button
                        className={`keyword_dots rounded px-1 text-indigo-300 hover:bg-indigo-50 ${showOptions ? 'bg-indigo-50 text-indigo-600 ' : ''}`}
                        onClick={() => setShowOptions(!showOptions)}
                    >
                        <Icon type="dots" size={20} />
                    </button>
                    {showOptions && (
                        <ul className='keyword_options customShadow absolute w-[180px] right-0 bg-white rounded border z-20'>
                            <li>
                                <a className={optionsButtonStyle} onClick={() => { handleRefreshKeyword(keyword.ID); setShowOptions(false); }}>
                                    <span className='bg-indigo-100 text-blue-700 px-1 rounded'><Icon type="reload" size={11} /></span> Refresh Keyword
                                </a>
                            </li>
                            <li>
                                <a className={optionsButtonStyle} onClick={() => { setSelectedKeywords([keyword.ID]); setShowRemoveModal(true); setShowOptions(false); }}>
                                    <span className='bg-red-100 text-red-600 px-1 rounded'><Icon type="trash" size={14} /></span> Remove Keyword
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
                <p className='p-9 pt-[10%] text-center text-gray-500'>
                    <Icon type="info" size={48} color="#999" />
                    <br /><br />
                    No keywords added yet. Add keywords from the Keywords tab.
                </p>
            </div>
        );
    }

    if (!competitors || competitors.length === 0) {
        return (
            <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
                <p className='p-9 pt-[10%] text-center text-gray-500'>
                    <Icon type="users" size={48} color="#999" />
                    <br /><br />
                    No competitors added yet. Add competitors from domain settings.
                </p>
            </div>
        );
    }

    return (
        <div>
            <div className='domKeywords flex flex-col bg-[white] rounded-md text-sm border mb-5'>
                {selectedKeywords.length > 0 && (
                    <div className='font-semibold text-sm py-4 px-8 text-gray-500'>
                        <ul>
                            <li className='inline-block mr-4'>
                                <a
                                    className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                                    onClick={handleRefreshSelected}
                                >
                                    <span className='bg-indigo-100 text-blue-700 px-1 rounded'><Icon type="reload" size={11} /></span> Refresh Competitors
                                </a>
                            </li>
                            <li className='inline-block mr-4'>
                                <a
                                    className='block px-2 py-2 cursor-pointer hover:text-indigo-600'
                                    onClick={() => setShowRemoveModal(true)}
                                >
                                    <span className='bg-red-100 text-red-600 px-1 rounded'><Icon type="trash" size={14} /></span> Remove Keywords
                                </a>
                            </li>
                        </ul>
                    </div>
                )}
                <div className='domkeywordsTable domkeywordsTable--keywords styled-scrollbar w-full overflow-auto min-h-[60vh]'>
                    <div className='w-full'>
                        <div className='domKeywords_head hidden lg:flex p-3 px-6 bg-[#FCFCFF] text-gray-600 justify-between items-center font-semibold border-y'>
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
                                    Keyword
                                </span>
                            </span>
                            <span className='domKeywords_head_position flex-1 basis-24 grow-0 text-center'>
                                Your Position
                            </span>
                            {competitors.map((competitor: string, index: number) => (
                                <span key={index} className='flex-1 basis-24 grow-0 text-center'>
                                    {competitor.replace(/^https?:\/\//, '').replace(/\/$/, '')}
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
                                    height={SCListHeight}
                                    width={'100%'}
                                    className={'styled-scrollbar'}
                                >
                                    {Row}
                                </List>
                            )}
                            {!isPending && processedKeywords.length === 0 && (
                                <p className='p-9 pt-[10%] text-center text-gray-500'>No Keywords Added for this Device Type.</p>
                            )}
                            {isPending && (
                                <p className='p-9 pt-[10%] text-center text-gray-500'>Loading Keywords...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showRemoveModal && selectedKeywords.length > 0 && (
                <Modal closeModal={() => { setSelectedKeywords([]); setShowRemoveModal(false); }} title={'Remove Keywords'}>
                    <div className='text-sm'>
                        <p>Are you sure you want to remove {selectedKeywords.length > 1 ? 'these' : 'this'} Keyword?</p>
                        <div className='mt-6 text-right font-semibold'>
                            <button
                                className='py-1 px-5 rounded cursor-pointer bg-indigo-50 text-slate-500 mr-3'
                                onClick={() => { setSelectedKeywords([]); setShowRemoveModal(false); }}
                            >
                                Cancel
                            </button>
                            <button
                                className='py-1 px-5 rounded cursor-pointer bg-red-400 text-white'
                                onClick={() => { deleteMutate(selectedKeywords); setShowRemoveModal(false); setSelectedKeywords([]); }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CompetitorsTable;
