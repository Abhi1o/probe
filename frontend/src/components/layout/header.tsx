'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import { UserNav } from './user-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="flex h-16 items-center border-b bg-white px-6">
      <div className="flex flex-1 items-center space-x-4">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search programs, transactions..."
            className="pl-10"
          />
        </div>

        <nav className="flex items-center space-x-4 ml-4">
          <Link
            href="/docs"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            Documentation
          </Link>
          <Link
            href="/docs/api"
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          >
            API
          </Link>
        </nav>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User Navigation */}
        <UserNav />
      </div>
    </header>
  );
}
