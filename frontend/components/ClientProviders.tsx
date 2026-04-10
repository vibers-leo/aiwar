'use client';

import { ReactNode } from 'react';
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

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
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
  );
}
