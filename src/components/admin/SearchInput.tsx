'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  /** URL query-string param used for the search term. Defaults to `q`. */
  readonly paramName?: string;
  readonly placeholder?: string;
  readonly debounceMs?: number;
  readonly className?: string;
  readonly ariaLabel?: string;
}

/**
 * URL-driven, debounced search field for admin list pages. Keeps the term in
 * `?q=` so results stay shareable and bookmarkable; updates use
 * `router.replace` so typing doesn't spam history entries.
 */
export function SearchInput({
  paramName = 'q',
  placeholder = 'Cerca…',
  debounceMs = 300,
  className,
  ariaLabel = 'Cerca',
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = searchParams.get(paramName) ?? '';
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef(initial);

  useEffect(() => {
    const next = searchParams.get(paramName) ?? '';
    if (next !== lastPushed.current) {
      lastPushed.current = next;
      setValue(next);
    }
  }, [searchParams, paramName]);

  function commit(next: string) {
    if (next === lastPushed.current) return;
    lastPushed.current = next;
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(paramName, next);
    else params.delete(paramName);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next.trim()), debounceMs);
  }

  function handleClear() {
    if (timer.current) clearTimeout(timer.current);
    setValue('');
    commit('');
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <SearchIcon
        aria-hidden
        className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
      />
      <Input
        type='search'
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (timer.current) clearTimeout(timer.current);
            commit(value.trim());
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className='pl-9 pr-9'
      />
      {value && (
        <button
          type='button'
          onClick={handleClear}
          aria-label='Cancella ricerca'
          className='absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <XIcon className='size-3.5' />
        </button>
      )}
    </div>
  );
}
