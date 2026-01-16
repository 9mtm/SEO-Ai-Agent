import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

type ManageCompetitorsProps = {
    domain: DomainType;
    closeModal: () => void;
};

const ManageCompetitors = ({ domain, closeModal }: ManageCompetitorsProps) => {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [competitors, setCompetitors] = useState<string[]>(domain.competitors || []);
    const [newCompetitor, setNewCompetitor] = useState('');
    const MAX_COMPETITORS = 3;

    const updateMutation = useMutation({
        mutationFn: async (updatedCompetitors: string[]) => {
            const response = await fetch('/api/domains/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    domain: domain.domain,
                    competitors: updatedCompetitors,
                }),
            });
            if (!response.ok) throw new Error('Failed to update competitors');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['domains'] });
            toast.success(t('tracking.manageCompetitors.success'));
            closeModal();
        },
        onError: () => {
            toast.error(t('tracking.manageCompetitors.error'));
        },
    });

    const handleAddCompetitor = () => {
        if (!newCompetitor.trim()) {
            toast.error(t('tracking.manageCompetitors.errorEmpty'));
            return;
        }
        if (competitors.length >= MAX_COMPETITORS) {
            toast.error(t('tracking.manageCompetitors.errorMax', { max: MAX_COMPETITORS }));
            return;
        }

        const cleanUrl = newCompetitor.trim();
        if (competitors.includes(cleanUrl)) {
            toast.error(t('tracking.manageCompetitors.errorExists'));
            return;
        }

        setCompetitors([...competitors, cleanUrl]);
        setNewCompetitor('');
    };

    const handleRemoveCompetitor = (index: number) => {
        setCompetitors(competitors.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        updateMutation.mutate(competitors);
    };

    return (
        <div className="modal">
            <div className="modal_content max-w-xl" onClick={(e) => e.stopPropagation()}>
                <button className="modal_close" onClick={closeModal}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-2xl font-bold mb-6">{t('tracking.manageCompetitors.title')}</h3>

                {/* Add Competitor */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('tracking.manageCompetitors.addLabel')}
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            placeholder={t('tracking.manageCompetitors.placeholder')}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={newCompetitor}
                            onChange={(e) => setNewCompetitor(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
                            disabled={competitors.length >= MAX_COMPETITORS}
                        />
                        <button
                            onClick={handleAddCompetitor}
                            disabled={competitors.length >= MAX_COMPETITORS}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('tracking.manageCompetitors.add')}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {t('tracking.manageCompetitors.count', { count: competitors.length, max: MAX_COMPETITORS })}
                    </p>
                </div>

                {/* Current Competitors */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">{t('tracking.manageCompetitors.currentTitle')}</h4>
                    {competitors.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-300 rounded-md">
                            {t('tracking.manageCompetitors.empty')}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {competitors.map((competitor, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <span className="text-sm text-gray-900">{competitor}</span>
                                    <button
                                        onClick={() => handleRemoveCompetitor(index)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        {t('tracking.manageCompetitors.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {updateMutation.isPending ? t('tracking.manageCompetitors.saving') : t('tracking.manageCompetitors.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageCompetitors;
