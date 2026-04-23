'use client';

import * as React from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { cents, type Currency } from '@/lib/domain';
import { formatPriceCents } from '@/lib/format';
import type { CashflowProductRow } from '@/lib/cashflow';

export interface CashflowGroup {
  readonly id: string;
  readonly label: string;
  readonly tone: 'positive' | 'negative';
  readonly rows: readonly CashflowProductRow[];
  readonly perMonthCents: readonly number[];
  readonly totalCents: number;
  readonly emptyLabel?: string;
}

export interface CashflowSummary {
  readonly label: string;
  readonly perMonthCents: readonly number[];
  readonly totalCents: number;
}

interface Props {
  readonly monthLabels: readonly string[];
  readonly groups: readonly CashflowGroup[];
  readonly summary?: CashflowSummary;
  readonly currency?: Currency;
  readonly defaultOpen?: readonly string[];
}

function gridTemplate(monthCount: number): string {
  return `minmax(160px,1.4fr) repeat(${monthCount}, minmax(68px,1fr)) minmax(120px,140px)`;
}

function ZeroOrAmount({
  amountCents,
  currency,
  signed,
  className,
}: {
  amountCents: number;
  currency: Currency;
  signed?: boolean;
  className?: string;
}) {
  if (amountCents === 0) {
    return (
      <span className={cn('text-muted-foreground/70', className)}>—</span>
    );
  }
  const abs = Math.abs(amountCents);
  const formatted = formatPriceCents(cents(abs), currency);
  const sign = amountCents < 0 ? '−' : signed ? '+' : '';
  return <span className={className}>{`${sign}${formatted}`}</span>;
}

const TONE_BADGE: Record<CashflowGroup['tone'], string> = {
  positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  negative: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
};

const TONE_VALUE: Record<CashflowGroup['tone'], string> = {
  positive: 'text-emerald-700 dark:text-emerald-300',
  negative: 'text-red-700 dark:text-red-300',
};

/**
 * Month-by-month table with optional summary row and collapsible category
 * groups. Reusable for any income/expense-style data — the parent passes
 * arbitrary `groups` and the component lays everything on a shared CSS grid
 * so rows stay aligned across groups.
 */
export function CashflowTable({
  monthLabels,
  groups,
  summary,
  currency = 'EUR',
  defaultOpen,
}: Props) {
  const template = gridTemplate(monthLabels.length);
  const initialOpen = defaultOpen ?? groups.map((g) => g.id);

  return (
    <div className='overflow-hidden rounded-2xl border border-border bg-background'>
      <div className='overflow-x-auto'>
        <div className='min-w-[900px]'>
          <div
            className='grid gap-x-2 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground'
            style={{ gridTemplateColumns: template }}
          >
            <div>Categoria</div>
            {monthLabels.map((label) => (
              <div key={label} className='text-right tabular-nums'>
                {label}
              </div>
            ))}
            <div className='border-l pl-3 text-right'>Totale</div>
          </div>

          {summary && (
            <div
              className='grid gap-x-2 border-b bg-muted/30 px-4 py-3 text-sm'
              style={{ gridTemplateColumns: template }}
            >
              <div className='font-semibold'>{summary.label}</div>
              {summary.perMonthCents.map((amount, i) => (
                <div key={i} className='text-right font-medium tabular-nums'>
                  <ZeroOrAmount
                    amountCents={amount}
                    currency={currency}
                    signed
                    className={
                      amount > 0
                        ? TONE_VALUE.positive
                        : amount < 0
                          ? TONE_VALUE.negative
                          : undefined
                    }
                  />
                </div>
              ))}
              <div className='border-l pl-3 text-right font-semibold tabular-nums'>
                <ZeroOrAmount
                  amountCents={summary.totalCents}
                  currency={currency}
                  signed
                  className={
                    summary.totalCents > 0
                      ? TONE_VALUE.positive
                      : summary.totalCents < 0
                        ? TONE_VALUE.negative
                        : undefined
                  }
                />
              </div>
            </div>
          )}

          <AccordionPrimitive.Root
            type='multiple'
            defaultValue={[...initialOpen]}
            className='flex flex-col'
          >
            {groups.map((group, idx) => (
              <AccordionPrimitive.Item
                key={group.id}
                value={group.id}
                className={cn(idx < groups.length - 1 && 'border-b')}
              >
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger
                    className={cn(
                      'group grid w-full cursor-pointer items-center gap-x-2 px-4 py-3 text-sm text-left transition-colors',
                      'hover:bg-muted/60 data-[state=open]:bg-muted/30',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    style={{ gridTemplateColumns: template }}
                  >
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <ChevronRightIcon
                        className='size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90'
                        strokeWidth={2.4}
                      />
                      <span
                        className={cn(
                          'inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold',
                          TONE_BADGE[group.tone],
                        )}
                        aria-hidden
                      >
                        {group.tone === 'positive' ? '+' : '−'}
                      </span>
                      <span className='truncate font-semibold text-foreground'>
                        {group.label}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        · {group.rows.length}
                      </span>
                    </div>
                    {group.perMonthCents.map((amount, i) => (
                      <div
                        key={i}
                        className={cn(
                          'text-right font-semibold tabular-nums',
                          TONE_VALUE[group.tone],
                        )}
                      >
                        <ZeroOrAmount amountCents={amount} currency={currency} />
                      </div>
                    ))}
                    <div
                      className={cn(
                        'border-l pl-3 text-right font-semibold tabular-nums',
                        TONE_VALUE[group.tone],
                      )}
                    >
                      <ZeroOrAmount
                        amountCents={group.totalCents}
                        currency={currency}
                      />
                    </div>
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>

                <AccordionPrimitive.Content className='overflow-hidden data-open:animate-accordion-down data-closed:animate-accordion-up'>
                  {group.rows.length === 0 ? (
                    <div className='px-4 py-4 text-sm text-muted-foreground'>
                      {group.emptyLabel ?? 'Nessun movimento in questa categoria.'}
                    </div>
                  ) : (
                    <div className='flex flex-col border-t bg-background'>
                      {group.rows.map((row) => (
                        <div
                          key={row.productId}
                          className='grid gap-x-2 border-b px-4 py-2.5 text-sm last:border-b-0'
                          style={{ gridTemplateColumns: template }}
                        >
                          <div className='truncate pl-10 text-foreground'>
                            {row.productName}
                          </div>
                          {row.perMonthCents.map((amount, i) => (
                            <div
                              key={i}
                              className='text-right tabular-nums'
                            >
                              <ZeroOrAmount
                                amountCents={amount}
                                currency={currency}
                              />
                            </div>
                          ))}
                          <div className='border-l pl-3 text-right font-medium tabular-nums'>
                            <ZeroOrAmount
                              amountCents={row.totalCents}
                              currency={currency}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>
      </div>
    </div>
  );
}
