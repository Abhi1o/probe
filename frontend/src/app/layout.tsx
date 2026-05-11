import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Probe - Solana Program Observability',
  description: 'Real-time monitoring and analytics for Solana programs',
  keywords: ['Solana', 'Blockchain', 'Monitoring', 'Analytics', 'Observability'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
