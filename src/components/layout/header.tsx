'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Page title */}
      {title && <h1 className="text-xl font-semibold">{title}</h1>}

      {/* Search - hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-md ml-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un cas, une séquence..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto md:ml-0">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  )
}
