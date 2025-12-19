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
      className="mx-auto w-full rounded-none border-0 bg-transparent px-2 py-4 text-[#f5ecda] shadow-none sm:rounded-[40px] sm:border sm:border-[#1d2942] sm:bg-[#0b1427]/90 sm:p-10 sm:shadow-[0_25px_80px_rgba(1,4,12,0.45)] sm:w-[80%]"
    >
      <header className="mb-6 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1d2942] bg-[#0a1020]/60 px-4 py-2.5 sm:justify-start sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <svg
            className="h-4 w-4 text-[#cfc0a3] sm:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
          <span className="text-xs font-medium uppercase tracking-[0.3em] text-[#f5ecda] sm:text-[#cfc0a3] sm:tracking-[0.4em]">
            Catalog
          </span>
        </div>
        <div className="flex items-center justify-center gap-1 rounded-xl border border-[#1d2942] bg-[#0a1020]/60 px-3 py-2 text-xs uppercase tracking-[0.2em] sm:justify-end sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:tracking-[0.3em]">
          <span className="mr-1 text-[#7a6f5a] sm:mr-0 sm:text-[#cfc0a3]">Sort:</span>
          <button
            type="button"
            onClick={() => setSortMode("date")}
            className={`rounded-lg px-2.5 py-1 transition sm:rounded-none sm:px-0 sm:py-0 ${
              sortMode === "date"
                ? "bg-[#1d2942] font-semibold text-[#f5ecda] sm:bg-transparent sm:underline sm:underline-offset-4"
                : "text-[#9a8b70] hover:bg-[#1d2942]/50 hover:text-[#f5ecda] sm:text-[#c6b798] sm:hover:bg-transparent"
            }`}
            aria-pressed={sortMode === "date"}
          >
            Date
          </button>
          <span className="hidden text-[#cfc0a3] sm:inline">/</span>
          <button
            type="button"
            onClick={() => setSortMode("rating")}
            className={`rounded-lg px-2.5 py-1 transition sm:rounded-none sm:px-0 sm:py-0 ${
              sortMode === "rating"
                ? "bg-[#1d2942] font-semibold text-[#f5ecda] sm:bg-transparent sm:underline sm:underline-offset-4"
                : "text-[#9a8b70] hover:bg-[#1d2942]/50 hover:text-[#f5ecda] sm:text-[#c6b798] sm:hover:bg-transparent"
            }`}
            aria-pressed={sortMode === "rating"}
          >
            Rating
          </button>
        </div>
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
      <div
        className={
          activeCategory === "Tweets"
            ? "mt-2 grid gap-1 sm:gap-1"
            : "mt-2 divide-y divide-[#1d2942] border-y border-[#1d2942]"
        }
      >
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
    <article className="group px-2 py-6 transition-colors hover:bg-[#121b24]/50 sm:px-3 sm:py-7">
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
        <div className="flex items-center justify-between pt-1 text-[0.6rem] uppercase tracking-[0.24em] text-[#bda986]">
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
    <article className="px-2 py-3 transition-colors hover:bg-[#121b24]/50 sm:px-3 sm:py-4">
      <div className="mx-auto w-full overflow-hidden sm:max-w-[560px]">
        {reading.tweetEmbedHtml ? (
          <div
            className="tweet-embed text-[#f5ecda]"
            dangerouslySetInnerHTML={{ __html: reading.tweetEmbedHtml }}
          />
        ) : (
          <div>
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
      </div>
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

