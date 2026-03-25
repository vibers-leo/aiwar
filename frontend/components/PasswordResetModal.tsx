'use client';

import { useState } from 'react';
import { X, Mail, CheckCircle, AlertTriangle } from 'lucide-react';
import { resetPassword } from '@/lib/firebase-auth';

interface PasswordResetModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            await resetPassword(email);
            setStatus('success');
            setMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다. 메일함을 확인해주세요.');
        } catch (error: any) {
            setStatus('error');
            console.error(error);
            if (error.code === 'auth/user-not-found') {
                setMessage('등록되지 않은 이메일 주소입니다.');
            } else if (error.code === 'auth/invalid-email') {
                setMessage('유효하지 않은 이메일 주소입니다.');
            } else {
                setMessage('메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-2 orbitron">PASSWORD RESET</h2>
                <p className="text-gray-400 text-sm mb-6">
                    가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                </p>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
                        <p className="text-green-400 font-bold mb-6">{message}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold orbitron tracking-wider transition-all shadow-lg shadow-cyan-500/20"
                        >
                            {isLoading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
