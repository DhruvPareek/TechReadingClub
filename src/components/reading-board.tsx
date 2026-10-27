"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CATEGORY_DESCRIPTORS,
  categoryToSlug,
  type Category,
  type Reading,
} from "@/types/readings";

type ReadingBoardProps = {
  readings: ReadonlyArray<Reading>;
  activeCategory: Category;
  tweetCards: Record<string, ReactNode>;
};

const STARS = [1, 2, 3, 4, 5] as const;
type SortMode = "date" | "rating";
const SORT_MODE_STORAGE_KEY = "reading-board-sort-mode";
const CATEGORY_NAV_SCROLL_KEY = "reading-board-category-nav-scroll";

export function ReadingBoard({ readings, activeCategory, tweetCards }: ReadingBoardProps) {
  const [sortMode, setSortMode] = useState<SortMode>(() => readStoredSortMode());
  const categoryNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    persistSortMode(sortMode);
  }, [sortMode]);

  // Restore scroll position on mount
  useEffect(() => {
    const savedScrollLeft = sessionStorage.getItem(CATEGORY_NAV_SCROLL_KEY);
    if (savedScrollLeft !== null && categoryNavRef.current) {
      categoryNavRef.current.scrollLeft = Number(savedScrollLeft);
    }
  }, []);

  const handleCategoryChange = (category: Category) => {
    if (category === activeCategory) return;
    // Save current scroll position before navigation
    if (categoryNavRef.current) {
      sessionStorage.setItem(CATEGORY_NAV_SCROLL_KEY, String(categoryNavRef.current.scrollLeft));
    }
  };

  const filteredReadings = useMemo(
    () => readings.filter((reading) => reading.categories.includes(activeCategory)),
    [readings, activeCategory],
  );

  const sortedReadings = useMemo(() => {
    const items = [...filteredReadings];
    if (activeCategory === "Tweets") {
      return items.reverse();
    }
    if (sortMode === "rating") {
      return items.sort((a, b) => {
        if (b.rating === a.rating) {
          return (
            new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
          );
        }
        return b.rating - a.rating;
      });
    }
    return items.sort(
      (a, b) =>
        new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime(),
    );
  }, [filteredReadings, sortMode, activeCategory]);

  return (
    <section>
      {/* Category Navigation */}
      <nav
        ref={categoryNavRef}
        className="category-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px"
      >
        {CATEGORY_DESCRIPTORS.map(({ id, label }) => {
          const isActive = activeCategory === id;
          const isFeatured = id === "Featured";
          return (
            <Link
              key={id}
              href={`/${categoryToSlug(id)}`}
              scroll={false}
              prefetch={id === "Tweets" ? true : null}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleCategoryChange(id)}
              className={`relative whitespace-nowrap px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              } ${isFeatured ? "" : ""}`}
            >
              <span className="inline-flex items-center gap-1">
                {isFeatured && <FeaturedSparkle />}
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sort Controls */}
      {activeCategory !== "Tweets" && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <span className="text-[var(--text-muted)]">Sort:</span>
          <button
            type="button"
            onClick={() => setSortMode("date")}
            className={`px-2 py-1 transition-colors ${
              sortMode === "date"
                ? "text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Date
          </button>
          <span className="text-[var(--border)]">·</span>
          <button
            type="button"
            onClick={() => setSortMode("rating")}
            className={`px-2 py-1 transition-colors ${
              sortMode === "rating"
                ? "text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Rating
          </button>
        </div>
      )}

      {/* Reading List */}
      <div className={activeCategory === "Tweets" ? "mt-4 space-y-3" : "mt-6 space-y-1"}>
        {sortedReadings.map((reading) => (
          <Fragment key={reading.id}>
            {tweetCards[reading.id] ?? <StandardReadingCard reading={reading} />}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

type ReadingCardProps = {
  reading: Reading;
};

function StandardReadingCard({ reading }: ReadingCardProps) {
  return (
    <article className="group rounded-lg px-3 py-4 transition-colors hover:bg-[var(--bg-hover)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <a
            href={reading.link}
            className="font-medium text-[var(--text)] decoration-[var(--border)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {reading.title}
          </a>
          <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>{reading.author}</span>
            <span>·</span>
            <span>{reading.type}</span>
          </div>
          {reading.summary && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {reading.summary}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 pt-0.5">
          <Rating rating={reading.rating} />
          <span className="text-xs text-[var(--text-muted)]">
            {formatReviewDate(reading.reviewDate)}
          </span>
        </div>
      </div>
    </article>
  );
}

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {STARS.map((value) => (
        <StarIcon key={value} filled={value <= rating} />
      ))}
    </div>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 ${filled ? "text-[var(--star-filled)]" : "text-[var(--star-empty)]"}`}
      fill="currentColor"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function formatReviewDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function FeaturedSparkle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-3 w-3 text-[var(--text-muted)]"
      fill="currentColor"
    >
      <path d="M9.048 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function readStoredSortMode(): SortMode {
  if (typeof window === "undefined") return "date";
  const stored = window.sessionStorage.getItem(SORT_MODE_STORAGE_KEY);
  return stored === "rating" ? "rating" : "date";
}

function persistSortMode(mode: SortMode) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SORT_MODE_STORAGE_KEY, mode);
}
