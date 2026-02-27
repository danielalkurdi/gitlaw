import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'gitlaw',
  description: 'Git-based version control for legal documents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
