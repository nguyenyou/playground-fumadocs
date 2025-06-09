import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <p className="text-fd-muted-foreground">
        <Link
          href="/docs"
          className="text-fd-foreground font-semibold underline"
        >
          Let's play!
        </Link>{' '}
      </p>
    </main>
  );
}
