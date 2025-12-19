import { ReadingBoard } from "@/components/reading-board";
import { fetchReadingsFromSheet } from "@/lib/google-sheets";
import { categoryFromSlug } from "@/types/readings";
import { notFound } from "next/navigation";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export const dynamicParams = true;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const category = categoryFromSlug(categorySlug);
  if (!category) {
    notFound();
  }

  const readings = await fetchReadingsFromSheet();

  return (
    <div className="min-h-screen text-[var(--text-primary)]">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-5 py-12 sm:px-8 lg:px-0">
        <section className="rounded-[56px] border border-[var(--border-color)] bg-[var(--bg-primary)]/80 px-6 py-14 text-center shadow-[0_45px_160px_var(--shadow-strong)] sm:px-12">
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.55em] text-[var(--text-accent)]">
            <span className="hidden h-px w-16 bg-current sm:block" aria-hidden />
            <span>Towards accelerating progress</span>
            <span className="hidden h-px w-16 bg-current sm:block" aria-hidden />
          </div>
          <h1 className="mt-6 font-display text-[clamp(2.8rem,6vw,4.8rem)] uppercase leading-tight tracking-[0.18em] text-[var(--text-title)]">
            <span className="block">The</span>
            <span className="block">Technology</span>
            <span className="block">Reading</span>
            <span className="block">Club</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            I keep a list of loosely technology related readings here.
          </p>
        </section>

        <ReadingBoard readings={readings} activeCategory={category} />

        <footer className="pb-8 text-center text-xs uppercase tracking-[0.4em] text-[var(--text-accent)]">
          email submissions to dhruvpareek883 [at] gmail.com
        </footer>
      </main>
    </div>
  );
}


