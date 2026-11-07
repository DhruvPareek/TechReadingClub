"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatPublicationDate, publicationDateTimestamp } from "@/lib/publication-date";
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

const CATEGORY_NAV_SCROLL_KEY = "reading-board-category-nav-scroll";
const PUBLISH_SORT_STORAGE_KEY = "reading-board-publish-sort";
type PublishSortOrder = "newest" | "oldest";

export function ReadingBoard({ readings, activeCategory, tweetCards }: ReadingBoardProps) {
  const [publishSortOrder, setPublishSortOrder] = useState<PublishSortOrder>("newest");
  const categoryNavRef = useRef<HTMLDivElement | null>(null);

  // Restore saved sorting after hydration so the initial client order matches the server.
  useEffect(() => {
    const savedScrollLeft = sessionStorage.getItem(CATEGORY_NAV_SCROLL_KEY);
    if (savedScrollLeft !== null && categoryNavRef.current) {
      categoryNavRef.current.scrollLeft = Number(savedScrollLeft);
    }
    const savedSort = sessionStorage.getItem(PUBLISH_SORT_STORAGE_KEY);
    if (savedSort === "newest" || savedSort === "oldest") {
      const frame = requestAnimationFrame(() => setPublishSortOrder(savedSort));
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  const togglePublishSort = () => {
    const nextOrder = publishSortOrder === "newest" ? "oldest" : "newest";
    setPublishSortOrder(nextOrder);
    sessionStorage.setItem(PUBLISH_SORT_STORAGE_KEY, nextOrder);
  };

  const handleCategoryChange = (category: Category) => {
    if (category === activeCategory) return;
    // Save current scroll position before navigation
    if (categoryNavRef.current) {
      sessionStorage.setItem(CATEGORY_NAV_SCROLL_KEY, String(categoryNavRef.current.scrollLeft));
    }
  };

  const sortedReadings = readings.filter((reading) =>
    reading.categories.includes(activeCategory),
  );
  if (activeCategory === "Tweets") {
    sortedReadings.reverse();
  } else {
    sortedReadings.sort((a, b) => {
      const aDate = publicationDateTimestamp(a.publishedDate);
      const bDate = publicationDateTimestamp(b.publishedDate);
      if (Number.isNaN(aDate)) return Number.isNaN(bDate) ? 0 : 1;
      if (Number.isNaN(bDate)) return -1;
      return publishSortOrder === "newest" ? bDate - aDate : aDate - bDate;
    });
  }

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

      {activeCategory !== "Tweets" && (
        <div className="mt-4 px-3 text-right">
          <button
            type="button"
            onClick={togglePublishSort}
            aria-label={`Publish Date, ${publishSortOrder} first. Sort ${publishSortOrder === "newest" ? "oldest" : "newest"} first`}
            title={`Sort ${publishSortOrder === "newest" ? "oldest" : "newest"} first`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--text-secondary)]"
          >
            Publish Date
            <span aria-hidden="true">{publishSortOrder === "newest" ? "↓" : "↑"}</span>
          </button>
        </div>
      )}

      {/* Reading List */}
      <div className={activeCategory === "Tweets" ? "mt-4 space-y-3" : "mt-2 space-y-1"}>
        {sortedReadings.map((reading) => (
          <Fragment key={JSON.stringify([reading.id, reading.title])}>
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
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-[var(--text-muted)]">
            {reading.author && <span>{reading.author}</span>}
            <span className="whitespace-nowrap">
              {reading.author && <span className="mr-2">·</span>}
              {reading.type}
            </span>
          </div>
          {reading.summary && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {reading.summary}
            </p>
          )}
        </div>
        <div className="shrink-0 pt-0.5 text-right">
          <span className="whitespace-nowrap text-sm tabular-nums text-[var(--text-date)]">
            {formatPublicationDate(reading.publishedDate)}
          </span>
        </div>
      </div>
    </article>
  );
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
