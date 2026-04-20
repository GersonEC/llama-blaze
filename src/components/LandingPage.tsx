import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background'>
      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-secondary)/90%,transparent_55%),radial-gradient(ellipse_at_bottom,var(--color-muted)/80%,transparent_60%)]'
      />

      <div
        aria-hidden='true'
        className='absolute inset-0 -z-10 opacity-[0.06] bg-[linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black_40%,transparent_80%)]'
      />

      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[55vw] w-[55vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/6 blur-[120px]'
      />

      <section className='relative flex flex-col items-center gap-10 px-6 py-20 text-center sm:gap-12'>
        <div className='relative'>
          <div
            aria-hidden='true'
            className='absolute inset-0 -z-10 rounded-full bg-foreground/5 blur-3xl'
          />
          <Image
            src='/llamablaze-logo.png'
            alt='Llamablaze'
            width={320}
            height={320}
            priority
            className='relative h-48 w-48 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] sm:h-64 sm:w-64 md:h-72 md:w-72'
          />
        </div>

        <div className='flex max-w-3xl flex-col items-center gap-4'>
          <h1 className='bg-linear-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl'>
            Discover the collection
          </h1>
          <p className='max-w-xl text-base text-muted-foreground sm:text-lg'>
            Premium sneakers & accessories — handpicked, quality checked,
            reserved online.
          </p>
        </div>

        <Button
          asChild
          size='lg'
          className='group h-14 rounded-full px-10 text-base font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 sm:text-lg'
        >
          <Link href='/shop'>
            Enter the shop
            <span
              aria-hidden='true'
              className='ml-1 transition-transform group-hover:translate-x-1'
            >
              →
            </span>
          </Link>
        </Button>
      </section>
    </main>
  );
}
