import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Suspense fallback for the reservation receipt. Mirrors the structure of
 * `ReservationConfirmation` (stamp pill → hero → perforated ticket → CTAs)
 * so the swap from skeleton to real receipt feels seamless. Shown during the
 * `router.push` from /checkout while the server fetches the reservation +
 * product enrichments — without it, the just-cleared cart on /checkout
 * would briefly flash the empty state.
 */
export default function ReservationLoading() {
  return (
    <div
      aria-busy='true'
      aria-live='polite'
      className='mx-auto flex w-full max-w-[760px] flex-col pt-[clamp(2rem,6vw,5rem)] pb-[clamp(3rem,7vw,6rem)]'
    >
      <span className='sr-only'>Caricamento prenotazione…</span>

      <Skeleton className='mb-7 h-[34px] w-[220px] rounded-full' />

      <div className='flex flex-col gap-[22px]'>
        <div className='flex flex-col gap-3.5'>
          <Skeleton className='h-[clamp(3.25rem,7.5vw,6.5rem)] w-[60%] rounded-md' />
          <Skeleton className='h-[clamp(3.25rem,7.5vw,6.5rem)] w-[42%] rounded-md' />
        </div>
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-4 w-full max-w-[58ch] rounded-md' />
          <Skeleton className='h-4 w-[88%] max-w-[52ch] rounded-md' />
          <Skeleton className='h-4 w-[64%] max-w-[40ch] rounded-md' />
        </div>
      </div>

      <section
        aria-hidden='true'
        className={cn(
          'relative mt-12 rounded-xs border border-border bg-background',
          'shadow-[0_1px_0_var(--border),0_30px_80px_-40px_rgba(0,0,0,0.15)]',
        )}
      >
        <div className='grid gap-4 px-[22px] pt-7 pb-[18px] sm:grid-cols-[1fr_auto] sm:px-8'>
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-2.5 w-[110px] rounded-sm' />
            <Skeleton className='h-7 w-[180px] rounded-md' />
            <Skeleton className='h-3 w-[240px] rounded-sm' />
          </div>
          <div className='flex flex-col gap-2 sm:items-end'>
            <Skeleton className='h-2.5 w-[80px] rounded-sm' />
            <Skeleton className='h-6 w-[140px] rounded-md' />
            <Skeleton className='h-3 w-[100px] rounded-sm' />
          </div>
        </div>

        <PerforatedDividerSkeleton />

        <ul className='flex flex-col px-[22px] pt-5 pb-2 sm:px-8'>
          {[0, 1].map((i) => (
            <li
              key={i}
              className='grid grid-cols-[56px_1fr_auto] items-center gap-[18px] border-t border-border py-3.5 first:border-t-0'
            >
              <Skeleton className='size-14 rounded-sm' />
              <div className='flex min-w-0 flex-col gap-1.5'>
                <Skeleton className='h-2.5 w-[80px] rounded-sm' />
                <Skeleton className='h-4 w-[70%] rounded-md' />
                <Skeleton className='h-3 w-[40%] rounded-sm' />
              </div>
              <Skeleton className='h-4 w-[72px] rounded-sm' />
            </li>
          ))}
        </ul>

        <div className='px-[22px] pt-3 pb-5 sm:px-8'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-baseline justify-between py-1.5'>
              <Skeleton className='h-3.5 w-[80px] rounded-sm' />
              <Skeleton className='h-3.5 w-[64px] rounded-sm' />
            </div>
            <div className='flex items-baseline justify-between py-1.5'>
              <Skeleton className='h-3.5 w-[90px] rounded-sm' />
              <Skeleton className='h-3.5 w-[48px] rounded-sm' />
            </div>
          </div>
          <div className='mt-2.5 flex items-baseline justify-between gap-4 border-t border-border pt-4'>
            <div className='flex flex-col gap-1.5'>
              <Skeleton className='h-3.5 w-[60px] rounded-sm' />
              <Skeleton className='h-2.5 w-[180px] rounded-sm' />
            </div>
            <Skeleton className='h-9 w-[120px] rounded-md' />
          </div>
        </div>

        <div
          className={cn(
            'flex items-center justify-between gap-4 border-t border-dashed border-border',
            'px-[22px] py-[18px] sm:px-8',
          )}
        >
          <Skeleton className='h-8 max-w-[260px] flex-1 rounded-sm' />
          <Skeleton className='h-3 w-[90px] rounded-sm' />
        </div>
      </section>

      <div className='mt-12 flex flex-wrap items-center gap-3.5'>
        <Skeleton className='h-[54px] w-[230px] rounded-xs' />
      </div>

      <div className='mt-7 flex items-start gap-2.5'>
        <Skeleton className='mt-0.5 size-4 shrink-0 rounded-sm' />
        <div className='flex flex-1 flex-col gap-1.5'>
          <Skeleton className='h-3.5 w-full max-w-[52ch] rounded-sm' />
          <Skeleton className='h-3.5 w-[78%] max-w-[44ch] rounded-sm' />
        </div>
      </div>
    </div>
  );
}

function PerforatedDividerSkeleton() {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'relative h-6 border-t border-b border-dashed border-border',
        "before:absolute before:top-1/2 before:left-[-12px] before:size-[22px] before:-translate-y-1/2 before:rounded-full before:border before:border-border before:bg-muted before:content-['']",
        "after:absolute after:top-1/2 after:right-[-12px] after:size-[22px] after:-translate-y-1/2 after:rounded-full after:border after:border-border after:bg-muted after:content-['']",
      )}
    />
  );
}
