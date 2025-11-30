"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_DESCRIPTORS,
  categoryToSlug,
  type Category,
  type Reading,
} from "@/types/readings";

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: () => void;
      };
    };
  }
}

type ReadingBoardProps = {
  readings: ReadonlyArray<Reading>;
  activeCategory: Category;
};

const STARS = [1, 2, 3, 4, 5] as const;
type SortMode = "date" | "rating";
const TWITTER_WIDGETS_SRC = "https://platform.twitter.com/widgets.js";
let twitterWidgetsLoaded = false;
const CATALOG_SECTION_ID = "catalog-section";
const CATEGORY_SCROLL_STORAGE_KEY = "reading-board-category-scroll-left";

export function ReadingBoard({ readings, activeCategory }: ReadingBoardProps) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const categoryNavRef = useRef<HTMLDivElement | null>(null);
  const lastScrollLeftRef = useRef(0);

  const handleCategoryChange = (category: Category) => {
    if (category === activeCategory) return;
    if (categoryNavRef.current) {
      const scrollLeft = categoryNavRef.current.scrollLeft;
      lastScrollLeftRef.current = scrollLeft;
      persistCategoryScrollLeft(scrollLeft);
    }
    router.push(`/${categoryToSlug(category)}`, { scroll: false });
    if (typeof window !== "undefined") {
      const section = document.getElementById(CATALOG_SECTION_ID);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleSortMode = () =>
    setSortMode((prev) => (prev === "date" ? "rating" : "date"));

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

  useEffect(() => {
    const node = categoryNavRef.current;
    if (!node) return undefined;
    const storedScrollLeft = readStoredCategoryScrollLeft();
    lastScrollLeftRef.current = storedScrollLeft;
    node.scrollLeft = storedScrollLeft;

    const handleScroll = () => {
      lastScrollLeftRef.current = node.scrollLeft;
      persistCategoryScrollLeft(node.scrollLeft);
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      node.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      id={CATALOG_SECTION_ID}
      className="mx-auto w-full rounded-[40px] border border-[#1d2942] bg-[#0b1427]/90 p-6 text-[#f5ecda] shadow-[0_25px_80px_rgba(1,4,12,0.45)] sm:w-[80%] sm:p-10"
    >
      <header className="mb-6 flex flex-wrap items-center justify-center gap-3 text-center sm:mb-6 sm:justify-between sm:gap-4 sm:text-left">
        <div className="flex-1 min-w-[180px] text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.4em] text-[#cfc0a3]">
            Catalog
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSortMode}
          className="w-full max-w-[280px] self-center rounded-full border border-[#f5ecda] bg-transparent px-5 py-2 text-xs uppercase tracking-[0.3em] text-[#f5ecda] transition hover:bg-[#121b24] sm:mx-0 sm:w-auto sm:self-auto"
        >
          Sort by: {sortMode === "date" ? "Date" : "Rating"}
        </button>
      </header>

      <nav
        ref={categoryNavRef}
        className="category-scrollbar mb-8 flex w-full gap-3 overflow-x-auto pb-2"
      >
        {CATEGORY_DESCRIPTORS.map(({ id, label }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleCategoryChange(id)}
              className={`flex min-w-max flex-col rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? "border-[#f5ecda] bg-[#050c1a] text-[#f5ecda]"
                  : "border-[#1d2942] bg-transparent text-[#c6b798] hover:bg-[#121b24]"
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-3 sm:gap-4">
        {sortedReadings.map((reading) => (
          <ReadingCard key={reading.id} reading={reading} />
        ))}
      </div>
    </section>
  );
}

type ReadingCardProps = {
  reading: Reading;
};

function ReadingCard({ reading }: ReadingCardProps) {
  if (isTweetReading(reading)) {
    return <TweetCard reading={reading} />;
  }
  return <StandardReadingCard reading={reading} />;
}

function StandardReadingCard({ reading }: ReadingCardProps) {
  return (
    <article className="group rounded-2xl border border-[#1f2b42] bg-[#0f192c] p-3 shadow-[0_18px_45px_rgba(1,4,12,0.35)] transition hover:bg-[#141f33] sm:p-4">
      <div className="space-y-4">
        <div className="flex-1 space-y-1.5">
          <a
            href={reading.link}
            className="reading-card-title font-display text-[1.05rem] font-semibold leading-tight text-[#fff5de] underline-offset-4 transition-all hover:underline sm:text-[1.25rem]"
            target="_blank"
            rel="noreferrer"
          >
            {reading.title}
          </a>
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f5ecda]">
            <span>{reading.author}</span>
            <span className="normal-case rounded-full border border-[#f5ecda]/40 px-2 py-[2px] text-[0.55rem] font-semibold tracking-[0.08em] text-[#f5ecda]">
              {reading.type}
            </span>
          </div>
          {reading.summary && (
            <p className="text-[0.82rem] leading-relaxed text-[#b8a68b]">
              {reading.summary}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#222e45] pt-3 text-[0.6rem] uppercase tracking-[0.24em] text-[#bda986]">
          <Rating rating={reading.rating} />
          <span className="text-[#9f8d6c]">{formatReviewDate(reading.reviewDate)}</span>
        </div>
      </div>
    </article>
  );
}

function TweetCard({ reading }: ReadingCardProps) {
  useTwitterWidgets();

  return (
    <article className="mx-auto w-full overflow-hidden rounded-2xl border border-[#1f2b42] bg-[#0f192c] p-0 shadow-[0_18px_45px_rgba(1,4,12,0.35)] self-center sm:max-w-[560px]">
      {reading.tweetEmbedHtml ? (
        <div
          className="tweet-embed text-[#f5ecda]"
          dangerouslySetInnerHTML={{ __html: reading.tweetEmbedHtml }}
        />
      ) : (
        <div className="p-3 sm:p-4">
          <p className="text-sm text-[#c6b798]">
            Tweet preview unavailable.{" "}
            <a
              href={reading.link}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              View it on X
            </a>
          </p>
        </div>
      )}
    </article>
  );
}

function Rating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[2px]" aria-label={`${rating} out of 5 stars`}>
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
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 ${filled ? "text-[#f7c873]" : "text-[#5c6479]"}`}
      fill="currentColor"
    >
      <path d="M12 17.3 6.6 20l1-5.8L3 9.8l5.8-.8L12 4l3.2 5 5.8.8-4.2 4.4 1 5.8z" />
    </svg>
  );
}

function formatReviewDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${year}`;
}

function isTweetReading(reading: Reading) {
  return reading.categories.includes("Tweets") || reading.type === "Tweet";
}

function useTwitterWidgets() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const loadWidgets = () => window.twttr?.widgets?.load();

    if (twitterWidgetsLoaded) {
      loadWidgets();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = TWITTER_WIDGETS_SRC;
    script.async = true;
    script.charset = "utf-8";
    script.addEventListener("load", loadWidgets);
    document.body.appendChild(script);
    twitterWidgetsLoaded = true;

    return () => {
      script.removeEventListener("load", loadWidgets);
    };
  }, []);
}

function readStoredCategoryScrollLeft() {
  if (typeof window === "undefined") return 0;
  const rawValue = window.sessionStorage.getItem(CATEGORY_SCROLL_STORAGE_KEY);
  const parsed = rawValue ? Number(rawValue) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function persistCategoryScrollLeft(value: number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CATEGORY_SCROLL_STORAGE_KEY,
    String(Math.max(0, value)),
  );
}

