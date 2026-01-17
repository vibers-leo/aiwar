
'use client';

import React, { useState } from 'react';
import { performSecureLogout } from '@/lib/secure-logout';
import { useUser } from '@/context/UserContext';

interface SecureLogoutButtonProps {
    className?: string;
    showText?: boolean;
}

export default function SecureLogoutButton({ className, showText = true }: SecureLogoutButtonProps) {
    const { user, profile } = useUser();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogoutClick = async () => {
        if (!confirm("정말 로그아웃 하시겠습니까? \n모든 로컬 데이터가 안전하게 삭제됩니다.")) return;

        setIsLoggingOut(true);

        // Pass user ID to secure logout (skipDataSync = true since we don't have critical state here)
        await performSecureLogout(user?.uid, true);
    };

    return (
        <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className={`
                group relative overflow-hidden rounded-lg bg-red-900/20 border border-red-500/30 
                px-4 py-2 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
        >
            <div className="flex items-center gap-2 relative z-10">
                {isLoggingOut ? (
                    <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs font-mono font-bold">TERMINATING...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {showText && <span className="text-xs font-mono font-bold">SECURE LOGOUT</span>}
                    </>
                )}
            </div>

            {/* Scanline Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </button>
    );
}
