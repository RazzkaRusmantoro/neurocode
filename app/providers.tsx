'use client';

import { SessionProvider } from 'next-auth/react';
import TopLoadingBar from './components/TopLoadingBar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TopLoadingBar />
      {children}
    </SessionProvider>
  );
}

