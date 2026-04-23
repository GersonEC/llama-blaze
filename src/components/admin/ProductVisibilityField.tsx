'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from '@/lib/domain';
import { cn } from '@/lib/utils';

interface ProductVisibilityFieldProps {
  readonly value: ProductStatus;
  readonly onChange: (value: ProductStatus) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

const STATUS_DESCRIPTIONS: Record<ProductStatus, string> = {
  active: 'Visibile nel negozio e nei risultati di ricerca.',
  draft: 'Solo per l\u2019admin. Non appare nel negozio.',
  hidden: 'Escluso da listini e ricerca, ma URL ancora accessibile.',
};

/**
 * Three-option radio group for `ProductStatus`, rendered as a column of
 * bordered rows with title + description. Keeps the existing domain values
 * (active / draft / hidden) so form state plumbing doesn't change.
 */
export function ProductVisibilityField({
  value,
  onChange,
  disabled,
  className,
}: ProductVisibilityFieldProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as ProductStatus)}
      disabled={disabled}
      className={cn('grid gap-2', className)}
    >
      {PRODUCT_STATUSES.map((status) => {
        const id = `product-visibility-${status}`;
        const isChecked = value === status;
        return (
          <label
            key={status}
            htmlFor={id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors',
              'hover:border-muted-foreground/50',
              isChecked && 'border-foreground bg-muted/30',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <RadioGroupItem id={id} value={status} className='mt-1' />
            <span className='flex flex-col gap-1 leading-snug'>
              <span className='text-sm font-semibold text-foreground'>
                {PRODUCT_STATUS_LABELS[status]}
              </span>
              <span className='text-xs text-muted-foreground'>
                {STATUS_DESCRIPTIONS[status]}
              </span>
            </span>
          </label>
        );
      })}
    </RadioGroup>
  );
}
