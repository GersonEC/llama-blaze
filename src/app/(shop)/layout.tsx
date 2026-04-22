export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex flex-1 flex-col'>
      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8'>
        {children}
      </main>
    </div>
  );
}
