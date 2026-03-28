import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./animations.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FirebaseProvider } from "@/components/FirebaseProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { AlertProvider } from "@/context/AlertContext";
import { FooterProvider } from "@/context/FooterContext";
import { UserProvider } from "@/context/UserContext";
import { SoundProvider } from "@/context/SoundContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { CardModalProvider } from "@/components/CardModalContext";
import MainLayout from "@/components/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AGI WAR : 전쟁의 서막 | 시즌1",
  description: "2030년의 미래를 바꿀 AI 카드 전략 게임 AGI WAR. 20개 AI 군단을 모아 최강의 시너지로 전쟁의 서막을 열어보세요!",
  keywords: "AI, 카드게임, 전략게임, AGI WAR, 턴제, GPT, Gemini, Claude",
  openGraph: {
    title: "AGI WAR : 전쟁의 서막",
    description: "20개 AI 군단으로 펼치는 전략 카드 배틀",
    url: "https://ai-war.vercel.app",
    siteName: "AGI WAR",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "AGI WAR : 전쟁의 서막",
    description: "20개 AI 군단으로 펼치는 전략 카드 배틀",
  },
  // Preconnect hints for faster resource loading
  other: {
    "link": [
      { rel: "preconnect", href: "https://firebasestorage.googleapis.com" },
      { rel: "preconnect", href: "https://firestore.googleapis.com" },
      { rel: "dns-prefetch", href: "https://firebasestorage.googleapis.com" },
    ].map(l => `<${l.href}>; rel=${l.rel}`).join(", ")
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AGI WAR",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a', // [NEW] Theme color for mobile browser
}; // [NEW] Mobile optimization

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950`}
        suppressHydrationWarning
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7704550771011130"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <FirebaseProvider>
          <UserProvider>
            <LanguageProvider>
              <SoundProvider>
                <AlertProvider>
                  <NotificationProvider>
                    <FooterProvider>
                      <CardModalProvider>
                        <ThemeProvider>
                          <MainLayout>
                            {children}
                          </MainLayout>
                        </ThemeProvider>
                      </CardModalProvider>
                    </FooterProvider>
                  </NotificationProvider>
                </AlertProvider>
              </SoundProvider>
            </LanguageProvider>
          </UserProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
