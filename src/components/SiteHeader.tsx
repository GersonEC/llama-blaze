import Image from 'next/image';
import Link from 'next/link';

const displayFont = 'font-[family-name:var(--font-fraunces)]';

export default function SiteHeader() {
  return (
    <header className='sticky top-0 z-40 border-b border-border bg-background'>
      <div className='mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 md:px-16'>
        <Link
          href='/'
          className='flex items-center gap-2.5'
          aria-label='LlamaBlaze'
        >
          <span className='grid h-10 w-10 place-items-center overflow-hidden rounded-md bg-accent'>
            <Image
              src='/llamablaze-logo.png'
              alt=''
              width={40}
              height={40}
              className='h-full w-full object-cover'
              priority
            />
          </span>
          <span
            className={`${displayFont} text-[26px] font-medium italic tracking-[-0.01em]`}
          >
            Llama<em className='italic font-semibold text-accent'>Blaze</em>
          </span>
        </Link>

        <div className='flex items-center gap-6'>
          <Link
            href='/shop'
            className='text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-accent'
          >
            Shop
          </Link>
          <Link
            href='/cart'
            className='text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-accent'
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}
