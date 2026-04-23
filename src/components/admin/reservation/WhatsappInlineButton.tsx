'use client';

import { MessageCircleIcon } from 'lucide-react';

/**
 * Small WhatsApp icon button designed to sit inside a clickable row (e.g.
 * the admin reservations list, where the whole row is a `next/link`).
 * Stops click propagation so it opens the WhatsApp chat without also
 * navigating the parent row.
 */
export function WhatsappInlineButton({ url }: { readonly url: string }) {
  return (
    <button
      type='button'
      aria-label='Chat su WhatsApp'
      title='Chat su WhatsApp'
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
      className='grid size-6 shrink-0 place-items-center rounded-full text-[#25D366] transition-colors hover:bg-[#25D366]/10 hover:text-[#128C7E]'
    >
      <MessageCircleIcon aria-hidden className='size-3.5' />
    </button>
  );
}
