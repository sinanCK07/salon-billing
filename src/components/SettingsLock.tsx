import React, { useState, useEffect } from 'react';
import { useSalonSettings } from '../context/SalonSettingsContext';
import { hashPassword } from '../utils/crypto';
import { Lock, Unlock, AlertCircle } from 'lucide-react';

interface SettingsLockProps {
    children: React.ReactNode;
}

export const SettingsLock: React.FC<SettingsLockProps> = ({ children }) => {
    const { settings } = useSalonSettings();
    const [isLocked, setIsLocked] = useState(!!settings.settingsPassword);
    const [passwordInput, setPasswordInput] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    // Auto-lock feature (Simple implementation: lock on component mount/unmount)
    // For full inactivity, we would need global listeners.

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsChecking(true);

        try {
            const hashed = await hashPassword(passwordInput);
            if (hashed === settings.settingsPassword) {
                setIsLocked(false);
                setPasswordInput('');
            } else {
                setError('Incorrect password');
            }
        } catch (err) {
            setError('Encryption error');
        } finally {
            setIsChecking(false);
        }
    };

    const handleResetPassword = () => {
        if (confirm('For security, resetting will clear the password protection. Are you sure?')) {
            // This matches the user's manual reset command
            const updatedSettings = { ...settings, settingsPassword: '' };
            localStorage.setItem('salon_settings', JSON.stringify(updatedSettings));
            window.location.reload();
        }
    };

    if (!isLocked || !settings.settingsPassword) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-purple-100 p-8 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Lock className="text-purple-600" size={40} />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Settings Protected</h2>
                <p className="text-gray-500 text-sm text-center mb-8">
                    Enter your administrator password to modify salon settings and service menu.
                </p>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Type password..."
                            className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all placeholder:text-gray-300 ${error ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            autoFocus
                        />
                        {error && (
                            <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-medium">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isChecking}
                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                    >
                        {isChecking ? 'Verifying...' : (
                            <>
                                <Unlock size={18} />
                                <span>Unlock Access</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleResetPassword}
                        className="w-full text-gray-400 text-xs hover:text-purple-600 transition-colors py-2"
                    >
                        Forgot password? <span className="underline">Reset settings protection</span>
                    </button>
                </form>
            </div>
        </div>
    );
};
