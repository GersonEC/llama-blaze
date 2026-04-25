import { cn } from '@/lib/utils';

interface SlugInputProps extends Omit<
  React.ComponentProps<'input'>,
  'prefix' | 'className'
> {
  /** Static prefix rendered before the editable segment. Defaults to `/shop/`. */
  readonly prefix?: string;
  readonly className?: string;
  readonly inputClassName?: string;
}

/**
 * Composite slug field: a single outlined shell with a static mono prefix
 * followed by an editable mono input. Matches the mockup's `.slug-wrap`. Uses
 * shadcn's focus-visible / aria-invalid color tokens so it blends with other
 * inputs and inherits dark-mode styles.
 */
export function SlugInput({
  prefix = '/shop/',
  className,
  inputClassName,
  ...inputProps
}: SlugInputProps) {
  return (
    <div
      className={cn(
        'group flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-transparent bg-input/50 font-mono text-sm transition-[color,box-shadow,background-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20',
        className,
      )}
    >
      <span
        aria-hidden
        className='flex select-none items-center pl-3.5 pr-1 text-muted-foreground'
      >
        {prefix}
      </span>
      <input
        {...inputProps}
        className={cn(
          'min-w-0 flex-1 bg-transparent pl-0 pr-3.5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          inputClassName,
        )}
        placeholder='nome-prodotto-123'
      />
    </div>
  );
}
