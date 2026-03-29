import type { Metadata, Viewport } from 'next';
import TossLayout from '@/components/toss/TossLayout';

export const metadata: Metadata = {
  title: 'AI 워 | 토스',
  description: 'AI 대전 카드 게임 — 토스에서 바로 플레이하세요',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function TossRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TossLayout serviceName="AI 워">{children}</TossLayout>;
}
