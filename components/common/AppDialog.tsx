/**
 * AppDialog — Promise-based confirm() / prompt() replacement
 * ----------------------------------------------------------
 * Use these two helpers instead of the native `window.confirm`/`window.prompt`
 * so every modal in the app follows the same design language (Radix Dialog).
 *
 * Usage:
 *
 *   const { confirmDialog, promptDialog, Dialogs } = useAppDialogs();
 *
 *   // In your JSX, render the host component once:
 *   <Dialogs />
 *
 *   // Then call them like native dialogs but with await:
 *   const ok = await confirmDialog({
 *     title: 'Delete workspace?',
 *     description: 'This will permanently remove the workspace.',
 *     confirmText: 'Delete',
 *     variant: 'danger'
 *   });
 *   if (!ok) return;
 *
 *   const name = await promptDialog({
 *     title: 'Name this token',
 *     placeholder: 'e.g. Claude Desktop',
 *     defaultValue: 'Personal Access Token'
 *   });
 *   if (!name) return;
 */
import { useCallback, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

// ---------- Types ----------

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
}

export interface PromptOptions {
    title: string;
    description?: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    /** Return a string to show an inline error; return null/undefined to accept. */
    validate?: (value: string) => string | null | undefined;
}

type ConfirmState =
    | { type: 'confirm'; options: ConfirmOptions; resolve: (v: boolean) => void }
    | { type: 'prompt'; options: PromptOptions; resolve: (v: string | null) => void }
    | null;

// ---------- Hook ----------

export function useAppDialogs() {
    const [state, setState] = useState<ConfirmState>(null);
    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const confirmDialog = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setState({ type: 'confirm', options, resolve });
        });
    }, []);

    const promptDialog = useCallback((options: PromptOptions) => {
        return new Promise<string | null>((resolve) => {
            setInputValue(options.defaultValue || '');
            setInputError(null);
            setState({ type: 'prompt', options, resolve });
            // Focus the input after the dialog mounts
            setTimeout(() => inputRef.current?.focus(), 50);
        });
    }, []);

    const close = (result: any) => {
        if (!state) return;
        state.resolve(result);
        setState(null);
        setInputValue('');
        setInputError(null);
    };

    const handleConfirm = () => {
        if (!state) return;
        if (state.type === 'prompt') {
            const trimmed = inputValue.trim();
            if (state.options.validate) {
                const err = state.options.validate(inputValue);
                if (err) { setInputError(err); return; }
            }
            close(trimmed || null);
        } else {
            close(true);
        }
    };

    const handleCancel = () => {
        if (!state) return;
        close(state.type === 'prompt' ? null : false);
    };

    const Dialogs = () => {
        const open = !!state;
        const isDanger = state?.type === 'confirm' && state.options.variant === 'danger';

        return (
            <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
                <DialogContent className="sm:max-w-[440px]">
                    {state && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{state.options.title}</DialogTitle>
                                {state.options.description && (
                                    <DialogDescription className="whitespace-pre-line">
                                        {state.options.description}
                                    </DialogDescription>
                                )}
                            </DialogHeader>

                            {state.type === 'prompt' && (
                                <div className="py-2">
                                    {state.options.label && (
                                        <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                                            {state.options.label}
                                        </label>
                                    )}
                                    <Input
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => { setInputValue(e.target.value); setInputError(null); }}
                                        placeholder={state.options.placeholder}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
                                            else if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
                                        }}
                                    />
                                    {inputError && (
                                        <p className="text-xs text-red-600 mt-1.5">{inputError}</p>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={handleCancel}>
                                    {state.options.cancelText || 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className={isDanger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                                >
                                    {state.options.confirmText || (state.type === 'prompt' ? 'OK' : 'Confirm')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        );
    };

    return { confirmDialog, promptDialog, Dialogs };
}
