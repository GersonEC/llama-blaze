'use client';

import { useState, useTransition } from 'react';
import { Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { deleteProductAction } from '@/app/admin/products/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteProductButtonProps {
  readonly productId: string;
  readonly productName: string;
}

/**
 * Header-level delete trigger for the product edit page. Navigates away on
 * success via the server action's redirect. Wraps the destructive action in
 * an AlertDialog so admins must explicitly confirm before deletion.
 */
export function DeleteProductButton({
  productId,
  productName,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.ok) {
        toast.error(result.error ?? 'Impossibile eliminare il prodotto.');
        setOpen(false);
      } else {
        toast.success('Prodotto eliminato');
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type='button' variant='destructive' size='sm'>
          <Trash2Icon data-icon='inline-start' />
          Elimina
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il prodotto?</AlertDialogTitle>
          <AlertDialogDescription>
            Stai per eliminare <strong>{productName}</strong>. L&rsquo;azione
            non è reversibile e rimuoverà il prodotto dal negozio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={isPending}
            onClick={handleConfirm}
          >
            <Trash2Icon data-icon='inline-start' />
            {isPending ? 'Eliminazione…' : 'Elimina'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
