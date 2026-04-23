'use client';

import { useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { deleteProductAction } from '@/app/admin/products/actions';
import { Button } from '@/components/ui/button';

interface DeleteProductButtonProps {
  readonly productId: string;
  readonly productName: string;
}

/**
 * Header-level delete trigger for the product edit page. Navigates away on
 * success via the server action's redirect. Uses a confirm() prompt instead
 * of a full dialog to mirror the mockup.
 */
export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        `Eliminare "${productName}"? L\u2019azione non e\u0300 reversibile.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) {
        toast.error(result.error ?? 'Impossibile eliminare il prodotto.');
      } else {
        toast.success('Prodotto eliminato');
      }
    });
  }

  return (
    <Button
      type='button'
      variant='destructive'
      size='sm'
      onClick={handleClick}
      disabled={isPending}
    >
      <Trash2Icon data-icon='inline-start' />
      Elimina
    </Button>
  );
}
