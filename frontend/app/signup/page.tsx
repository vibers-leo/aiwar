'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { signUpWithEmail } from '@/lib/firebase-auth';
import { login, validateUsername, validatePassword } from '@/lib/auth-utils';
import { BackgroundBeams } from '@/components/ui/aceternity/background-beams';
import { HoverBorderGradient } from '@/components/ui/aceternity/hover-border-gradient';

function SignupForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/main';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // [Reliability Patch] Clear all local session data before starting fresh
        const { gameStorage } = await import('@/lib/game-storage');
        gameStorage.clearAllSessionData();

        // Validation
        const emailValidation = validateUsername(email);
        if (!emailValidation.valid) {
            setError(emailValidation.message);
            setIsLoading(false);
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.message);
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setIsLoading(false);
            return;
        }

        // Signup Attempt via Firebase
        try {
            const firebaseUser = await signUpWithEmail(email, password);

            if (firebaseUser) {
                console.log("[Signup] Firebase signup successful. Syncing local logic...");

                // [Sync] Also create local user record for legacy compatibility if needed
                // But primarily we rely on Firebase now.
                login(email, password);

                setTimeout(() => {
                    router.push(redirectUrl); // Redirect to Main or requested page
                }, 500);
            } else {
                // Error is handled inside signUpWithEmail via alert
                setIsLoading(false);
            }
        } catch (err: any) {
            setError(err.message || '가입 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            <BackgroundBeams className="opacity-40" />

            <div className="relative z-10 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4 animate-pulse">🧬</div>
                    <h1 className="text-4xl font-black text-white mb-2 orbitron tracking-tight text-center">신규 지휘관_</h1>
                    <p className="text-cyan-400/60 font-mono text-sm tracking-widest text-center">AI 전쟁에 참여하세요</p>
                </div>

                {/* Signup Form */}
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_rgba(88,28,135,0.2)] relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl translate-x-1 -translate-y-1" />
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-purple-500/30 rounded-bl-2xl -translate-x-1 translate-y-1" />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">이메일 주소</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono text-sm"
                                placeholder="이메일을 입력하세요"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                                placeholder="비밀번호를 입력하세요"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                                placeholder="비밀번호를 다시 입력하세요"
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-red-400 text-xs font-mono text-center animate-pulse">
                                [오류]: {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <HoverBorderGradient
                                as="button"
                                type="submit"
                                disabled={isLoading}
                                containerClassName="w-full rounded-xl"
                                className="w-full bg-gradient-to-r from-purple-900/80 to-pink-900/80 hover:from-purple-800 hover:to-pink-800 text-white py-4 font-black orbitron tracking-widest uppercase"
                            >
                                {isLoading ? '등록 중...' : '지휘관 등록'}
                            </HoverBorderGradient>
                        </div>
                    </form>

                    {/* Footer Links */}
                    <div className="mt-8 flex flex-col items-center gap-4 text-sm font-mono">
                        <p className="text-gray-500 text-xs">
                            이미 계정이 있으신가요?{' '}
                            <Link href="/" className="text-purple-400 hover:text-purple-300 font-bold ml-1 hover:underline text-center">
                                로그인하기
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-white font-mono">Loading...</div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
