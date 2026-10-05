import { Search, X } from 'lucide-react'
import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  const hasValue = value != null && String(value).length > 0
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        className={cn('pl-9 pr-9', className)}
        {...props}
      />
      {hasValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
