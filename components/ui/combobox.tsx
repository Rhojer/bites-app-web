'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  metadata?: Record<string, unknown>
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | null
  onChange: (value: string | null, option?: ComboboxOption | null) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  renderItem?: (option: ComboboxOption, isSelected: boolean) => React.ReactNode
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar opción...',
  searchPlaceholder = 'Buscar...',
  emptyText = 'No se encontraron resultados.',
  className,
  disabled = false,
  renderItem,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value) || null

  const filteredOptions = options.filter((opt) => {
    const labelMatch = opt.label.toLowerCase().includes(search.toLowerCase())
    const descMatch = opt.description?.toLowerCase().includes(search.toLowerCase())
    return labelMatch || descMatch
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border bg-card text-foreground transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-primary/30',
          disabled && 'opacity-50 cursor-not-allowed',
          open && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground ml-2" />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border bg-popover text-popover-foreground shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Search Input */}
          <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Option List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-border/30">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value, opt)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer select-none transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted/70 text-foreground'
                    )}
                  >
                    {renderItem ? (
                      renderItem(opt, isSelected)
                    ) : (
                      <div className="flex flex-col min-w-0 flex-1 mr-2">
                        <span className="truncate font-medium">{opt.label}</span>
                        {opt.description && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    )}
                    {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-1.5" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
