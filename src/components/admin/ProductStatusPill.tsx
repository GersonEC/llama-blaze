import { cn } from '@/lib/utils';
import { PRODUCT_STATUS_LABELS, type ProductStatus } from '@/lib/domain';

const TONES: Record<ProductStatus, string> = {
  active: 'bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-200',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-200',
  hidden: 'bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-200',
};

export function ProductStatusPill({
  status,
  className,
}: {
  readonly status: ProductStatus;
  readonly className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase leading-none tracking-[0.08em]',
        TONES[status],
        className,
      )}
    >
      <span
        aria-hidden
        className='size-1.5 rounded-full bg-current opacity-90'
      />
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}
