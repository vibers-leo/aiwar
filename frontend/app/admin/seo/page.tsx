'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Globe, ExternalLink, ArrowLeft, CheckCircle, XCircle, Code, FileText } from 'lucide-react';

const SITE_URL = 'https://ai-war.vercel.app';
const SITE_NAME = 'AGI WAR';

interface SiteMeta {
  title: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  description: string;
  naverVerification: string;
  canonical: string;
  jsonLd: boolean;
  jsonLdType: string | null;
}

export default function AdminSeoPage() {
  const [liveMeta, setLiveMeta] = useState<SiteMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [llmsTxt, setLlmsTxt] = useState<boolean | null>(null);

  const fetchMeta = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/site-meta?url=${encodeURIComponent(SITE_URL)}`);
      const data = await res.json();
      if (data.success) {
        setLiveMeta(data.meta);
      } else {
        setError(data.error || '불러오기 실패');
      }
    } catch (e: any) {
      setError(e.message || '네트워크 오류');
    }
    setLoading(false);
  };

  const handleFetch = async () => {
    await fetchMeta();
    try {
      const res = await fetch(`${SITE_URL}/llms.txt`, { signal: AbortSignal.timeout(5000) });
      setLlmsTxt(res.ok);
    } catch {
      setLlmsTxt(false);
    }
  };

  const statusItems = liveMeta ? [
    { ok: !!liveMeta.ogTitle, label: 'OG 타이틀', value: liveMeta.ogTitle },
    { ok: !!liveMeta.ogDescription, label: 'OG 설명', value: liveMeta.ogDescription },
    { ok: !!liveMeta.ogImage, label: 'OG 이미지', value: liveMeta.ogImage ? '설정됨' : '' },
    { ok: !!liveMeta.naverVerification, label: '네이버 인증', value: liveMeta.naverVerification || '' },
    { ok: !!liveMeta.description, label: 'Meta Description', value: liveMeta.description },
    { ok: !!liveMeta.canonical, label: 'Canonical URL', value: liveMeta.canonical },
  ] : [];

  const seoTools = [
    { name: '네이버 서치어드바이저', url: 'https://searchadvisor.naver.com' },
    { name: '구글 서치콘솔', url: 'https://search.google.com/search-console' },
    { name: 'OG 미리보기 테스트', url: `https://www.opengraph.xyz/url/${encodeURIComponent(SITE_URL)}` },
    { name: 'Google PageSpeed', url: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL)}` },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">SEO 관리</h1>
            <p className="text-sm text-gray-500">{SITE_NAME} — 검색엔진 최적화 현황</p>
          </div>
        </div>

        {/* 사이트 정보 */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-4">사이트 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500">도메인</p>
              <p className="text-sm font-medium text-gray-200">{SITE_URL.replace('https://', '')}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">프로젝트</p>
              <p className="text-sm font-medium text-gray-200">{SITE_NAME}</p>
            </div>
          </div>
        </div>

        {/* 라이브 체크 */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">
              실시간 SEO 현황
              <span className="ml-2 text-[10px] font-normal text-cyan-400 normal-case">라이브 체크</span>
            </h3>
            <button
              onClick={handleFetch}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '체크 중...' : '현재 상태 불러오기'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {liveMeta ? (
            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                {liveMeta.ogImage ? (
                  <img src={liveMeta.ogImage} alt="OG" className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-white/5 flex items-center justify-center">
                    <p className="text-xs text-gray-600">OG 이미지 없음</p>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-[10px] text-gray-600">{SITE_URL.replace('https://', '')}</p>
                  <p className="text-sm font-bold mt-1">{liveMeta.ogTitle || liveMeta.title || '(타이틀 없음)'}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{liveMeta.ogDescription || liveMeta.description || '(설명 없음)'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statusItems.map((item) => (
                  <div key={item.label} className={`p-3 rounded-xl border ${item.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${item.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {item.label}
                    </div>
                    {item.value && (
                      <p className="text-[10px] text-gray-500 mt-1 truncate">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase">AEO 상태 (AI 검색 최적화)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${liveMeta.jsonLd ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${liveMeta.jsonLd ? 'text-emerald-400' : 'text-red-400'}`}>
                      {liveMeta.jsonLd ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <Code className="w-3 h-3" />
                      JSON-LD
                    </div>
                    {liveMeta.jsonLdType && (
                      <p className="text-[10px] text-gray-500 mt-1">@type: {liveMeta.jsonLdType}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl border ${llmsTxt ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${llmsTxt ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {llmsTxt ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <FileText className="w-3 h-3" />
                      llms.txt
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{llmsTxt ? '존재함' : '없음'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-600">&quot;현재 상태 불러오기&quot; 버튼으로 사이트의 OG/SEO 상태를 확인하세요.</p>
            </div>
          )}
        </div>

        {/* SEO 도구 링크 */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">SEO 도구</h3>
          <div className="grid grid-cols-2 gap-3">
            {seoTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors text-sm text-gray-300"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
                {tool.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
