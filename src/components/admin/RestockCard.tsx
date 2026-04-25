'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2Icon, PackagePlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  recordVariantPurchaseAction,
  restockProductAction,
} from '@/app/admin/products/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentStockCard } from './CurrentStockCard';

interface RestockVariantOption {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly stock: number;
}

interface RestockCardProps {
  productId: string;
  /** Current stock, shown in the header so you see the effect of your restock. */
  currentStock: number;
  /** Pre-fills the unit cost input from the product's last known value. */
  defaultUnitCostCents: number;
  /**
   * Color variants attached to the product. When non-empty, the restock form
   * forces the admin to pick which variant to restock — the RPC decrements
   * that specific variant's stock instead of the product row.
   */
  variants?: readonly RestockVariantOption[];
}

function centsToMajor(cents: number | null): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2);
}

function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RestockCard({
  productId,
  currentStock,
  defaultUnitCostCents,
  variants = [],
}: RestockCardProps) {
  const router = useRouter();
  const hasVariants = variants.length > 0;
  const [open, setOpen] = useState(false);
  const [variantId, setVariantId] = useState<string>(variants[0]?.id ?? '');
  const [purchasedAt, setPurchasedAt] = useState(todayISO());
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState(centsToMajor(defaultUnitCostCents));
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function reset() {
    setVariantId(variants[0]?.id ?? '');
    setPurchasedAt(todayISO());
    setQuantity('1');
    setUnitCost(centsToMajor(defaultUnitCostCents));
    setShippingCost('');
    setNotes('');
    setError(null);
    setFieldErrors({});
  }

  function handleClose() {
    setOpen(false);
    reset();
  }

  function parseMajorToCents(input: string, label: string): number | null {
    const trimmed = input.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) {
      setError(`${label}: inserisci un numero valido.`);
      return null;
    }
    return Math.round(n * 100);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
      setFieldErrors({ quantity: ['Quantità deve essere un intero positivo'] });
      return;
    }

    const unitCostCents = parseMajorToCents(unitCost, 'Costo unitario');
    if (unitCostCents == null) {
      setFieldErrors({ unitCostCents: ['Obbligatorio'] });
      return;
    }
    const shippingCostCentsRaw = parseMajorToCents(shippingCost, 'Costo spedizione');
    const shippingCostCents = shippingCostCentsRaw ?? 0;

    if (hasVariants && !variantId) {
      setFieldErrors({ variantId: ['Seleziona un colore'] });
      return;
    }

    startTransition(async () => {
      const result = hasVariants
        ? await recordVariantPurchaseAction({
            variantId,
            productId,
            purchasedAt: purchasedAt || null,
            quantity: qty,
            unitCostCents,
            shippingCostCents,
            notes: notes.trim(),
          })
        : await restockProductAction({
            productId,
            purchasedAt: purchasedAt || null,
            quantity: qty,
            unitCostCents,
            shippingCostCents,
            notes: notes.trim(),
          });

      if (!result.ok) {
        setError(result.error ?? 'Impossibile registrare il reintegro.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success('Reintegro registrato');
      handleClose();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <CurrentStockCard
        stock={currentStock}
        description={
          hasVariants
            ? 'Registra un acquisto per il colore selezionato.'
            : 'Registra un acquisto per aggiornare scorte e costi.'
        }
        action={
          <Button
            type='button'
            onClick={() => setOpen(true)}
            className='w-full justify-center'
          >
            <PackagePlusIcon data-icon='inline-start' />
            Registra acquisto
          </Button>
        }
      />
    );
  }

  return (
    <Card size='sm'>
      <CardHeader className='flex flex-row items-center justify-between gap-3'>
        <CardTitle className='uppercase tracking-widest text-muted-foreground text-xs'>
          Nuovo acquisto
        </CardTitle>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          onClick={handleClose}
          aria-label='Annulla'
        >
          <XIcon />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <fieldset disabled={isPending} className='flex flex-col gap-4'>
            <legend className='sr-only'>Registra acquisto</legend>
            <FieldGroup>
              {hasVariants && (
                <Field data-invalid={fieldErrors.variantId ? true : undefined}>
                  <FieldLabel htmlFor='restock-variant'>Colore *</FieldLabel>
                  <Select
                    value={variantId}
                    onValueChange={(v) => setVariantId(v)}
                  >
                    <SelectTrigger id='restock-variant' className='w-full'>
                      <SelectValue placeholder='Seleziona colore' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <span className='inline-flex items-center gap-2'>
                              <span
                                aria-hidden='true'
                                className='size-3 rounded-full border border-border'
                                style={{ background: v.hex }}
                              />
                              {v.name}
                              <span className='text-muted-foreground text-xs'>
                                ({v.stock})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldErrors.variantId && (
                    <FieldError>{fieldErrors.variantId.join(' · ')}</FieldError>
                  )}
                </Field>
              )}

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='restock-date'>Data *</FieldLabel>
                  <Input
                    id='restock-date'
                    type='date'
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    required
                  />
                </Field>
                <Field data-invalid={fieldErrors.quantity ? true : undefined}>
                  <FieldLabel htmlFor='restock-quantity'>Quantità *</FieldLabel>
                  <Input
                    id='restock-quantity'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputMode='numeric'
                    required
                    aria-invalid={fieldErrors.quantity ? true : undefined}
                  />
                  {fieldErrors.quantity && (
                    <FieldError>{fieldErrors.quantity.join(' · ')}</FieldError>
                  )}
                </Field>
              </div>

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <Field data-invalid={fieldErrors.unitCostCents ? true : undefined}>
                  <FieldLabel htmlFor='restock-unit-cost'>Costo unitario *</FieldLabel>
                  <Input
                    id='restock-unit-cost'
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    inputMode='decimal'
                    placeholder='es. 12.50'
                    required
                    aria-invalid={fieldErrors.unitCostCents ? true : undefined}
                  />
                  {fieldErrors.unitCostCents ? (
                    <FieldError>{fieldErrors.unitCostCents.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>Quanto hai pagato per una singola unità.</FieldDescription>
                  )}
                </Field>
                <Field data-invalid={fieldErrors.shippingCostCents ? true : undefined}>
                  <FieldLabel htmlFor='restock-shipping-cost'>
                    Spedizione totale
                  </FieldLabel>
                  <Input
                    id='restock-shipping-cost'
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    inputMode='decimal'
                    placeholder='es. 20.00'
                    aria-invalid={fieldErrors.shippingCostCents ? true : undefined}
                  />
                  {fieldErrors.shippingCostCents ? (
                    <FieldError>{fieldErrors.shippingCostCents.join(' · ')}</FieldError>
                  ) : (
                    <FieldDescription>
                      Totale per questo lotto. Lascia vuoto se la spedizione
                      era gratis.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor='restock-notes'>Note</FieldLabel>
                <Textarea
                  id='restock-notes'
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Es. numero fattura, fornitore, …'
                />
              </Field>

              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </FieldGroup>
          </fieldset>

          <div className='flex items-center gap-2'>
            <Button type='submit' disabled={isPending}>
              {isPending && <Loader2Icon data-icon='inline-start' className='animate-spin' />}
              {isPending ? 'Salvataggio…' : 'Registra'}
            </Button>
            <Button type='button' variant='ghost' size='sm' onClick={handleClose}>
              Annulla
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
