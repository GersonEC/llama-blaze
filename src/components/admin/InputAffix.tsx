import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputAffixProps extends React.ComponentProps<typeof Input> {
  /** Inline label rendered inside the input on the left (e.g. `€`). */
  readonly left?: ReactNode;
  /** Inline label rendered inside the input on the right (e.g. `%`, `EUR`). */
  readonly right?: ReactNode;
}

/**
 * Input wrapper that renders static inline labels ("affixes") inside the
 * input box on either side. The affixes are not interactive and reserve space
 * via left/right padding on the input. Purely presentational — keeps the
 * underlying `<input>` API untouched so it drops in anywhere.
 */
export function InputAffix({ left, right, className, ...props }: InputAffixProps) {
  return (
    <div className='relative flex w-full items-center'>
      {left && (
        <span
          aria-hidden
          className='pointer-events-none absolute left-3.5 font-mono text-sm font-medium text-muted-foreground'
        >
          {left}
        </span>
      )}
      <Input
        className={cn(
          left && 'pl-8',
          right && 'pr-10',
          className,
        )}
        {...props}
      />
      {right && (
        <span
          aria-hidden
          className='pointer-events-none absolute right-3.5 font-mono text-xs font-medium text-muted-foreground'
        >
          {right}
        </span>
      )}
    </div>
  );
}
