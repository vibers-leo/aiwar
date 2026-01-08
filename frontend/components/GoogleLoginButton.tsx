'use client';

import { signInWithGoogle } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react'; // [FIX] Added useEffect
import { useUser } from '@/context/UserContext'; // [FIX] Added useUser

export default function GoogleLoginButton() {
    const router = useRouter();
    const { user } = useUser(); // [FIX] Get user from context
    const [isLoading, setIsLoading] = useState(false);

    // [Safety] If user is detected while loading (even if promise hangs), redirect.
    useEffect(() => {
        if (isLoading && user) {
            console.log("[GoogleLogin] User detected via Context. Redirecting...");
            router.push('/');
        }
    }, [user, isLoading, router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithGoogle();
            if (result.success) {
                // router.push('/') handled by effect or here
                router.push('/');
            } else {
                if (result.message) alert(result.message);
                setIsLoading(false);
            }
        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
                <img src="/google-logo.svg" alt="Google" className="w-5 h-5" onError={(e) => {
                    // Fallback if logo missing
                    e.currentTarget.style.display = 'none';
                }} />
            )}
            <span>{isLoading ? '연결 중...' : 'Google로 시작하기'}</span>
        </button>
    );
}
