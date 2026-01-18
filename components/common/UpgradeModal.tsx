import React from 'react';
import Modal from './Modal';
import { useRouter } from 'next/router';
import { Crown } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

const UpgradeModal = ({ isOpen, onClose, message }: UpgradeModalProps) => {
    const router = useRouter();
    if (!isOpen) return null;

    return (
        <Modal closeModal={onClose} width="[400px]" verticalCenter={true}>
            <div className="text-center p-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-200">
                    <Crown className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upgrade Required</h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                    {message || "You've reached the limits of your current plan."}
                    <br />
                    <span className="text-xs text-gray-500 mt-2 block">Upgrade now to add more domains & keywords.</span>
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={() => router.push('/profile/billing')}
                        className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all shadow-sm text-sm"
                    >
                        Upgrade Plan
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UpgradeModal;
