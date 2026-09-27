import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-6 pb-24 pt-28 lg:px-8">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
        {children}
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-primary underline underline-offset-2 hover:text-[color:var(--color-accent-primary-light)]"
    >
      {children}
    </a>
  );
}
