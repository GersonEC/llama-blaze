'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <Button
      type='button'
      onClick={handle}
      aria-label={label}
      variant='ghost'
      size='icon-xs'
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  );
}
