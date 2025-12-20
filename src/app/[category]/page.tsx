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
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-12 text-center">
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--text)] sm:text-4xl">
            The Technology Reading Club
          </h1>
          <p className="mt-3 flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <span className="h-px w-8 bg-current" />
            <span>Towards accelerating progress</span>
            <span className="h-px w-8 bg-current" />
          </p>
        </header>

        <ReadingBoard readings={readings} activeCategory={category} />

        <footer className="mt-16 border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-muted)]">
          Submissions: dhruvpareek883@gmail.com
        </footer>
      </main>
    </div>
  );
}
