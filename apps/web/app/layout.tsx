import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Better Auth Dashboard - Multi-Tenant Enterprise Platform',
  description: 'Secure multi-tenant dashboard with advanced authentication and role-based access control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
