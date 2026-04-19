'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Ignore — clipboard may be blocked.
    }
  }

  return (
    <button
      type='button'
      onClick={handle}
      aria-label={label}
      className='rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-white/70 hover:bg-white/10'
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
