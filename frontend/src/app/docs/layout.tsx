'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Code2, 
  Terminal, 
  Activity, 
  ShieldAlert, 
  Wallet, 
  Network,
  Zap
} from 'lucide-react';

const docNavigation = [
  {
    title: 'Introduction',
    items: [
      { name: 'Welcome', href: '/docs', icon: BookOpen },
      { name: 'Getting Started', href: '/docs/getting-started', icon: Zap },
      { name: 'Changelog', href: '/docs/changelog', icon: BookOpen },
    ],
  },
  {
    title: 'Core Features',
    items: [
      { name: 'Program Analytics', href: '/docs/program-analytics', icon: Activity },
      { name: 'Instruction Deep-Dive', href: '/docs/instructions', icon: Code2 },
      { name: 'Health Scores', href: '/docs/health', icon: Activity },
      { name: 'CPI Analysis', href: '/docs/cpi', icon: Network },
      { name: 'MEV Detection', href: '/docs/mev', icon: ShieldAlert },
      { name: 'Wallet Intelligence', href: '/docs/wallets', icon: Wallet },
      { name: 'Monitoring', href: '/docs/monitoring', icon: Zap },
    ],
  },
  {
    title: 'Developers',
    items: [
      { name: 'TypeScript SDK', href: '/docs/sdk', icon: Code2 },
      { name: 'CLI Tool', href: '/docs/cli', icon: Terminal },
      { name: 'API Reference', href: '/docs/api', icon: Terminal },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white">
      {/* Docs Sidebar */}
      <div className="w-64 flex-shrink-0 border-r bg-gray-50/50 p-6 hidden md:block">
        <div className="mb-8">
            <Link href="/" className="font-bold text-xl text-blue-600">← Back to Probe</Link>
        </div>
        <div className="space-y-8">
          {docNavigation.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {section.title}
              </h4>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="mx-auto max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
