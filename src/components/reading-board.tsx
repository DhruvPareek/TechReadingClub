"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
        createTweet: (
          tweetId: string,
          element: HTMLElement,
          options?: { dnt?: boolean },
        ) => Promise<HTMLElement | undefined>;
        load: (element?: HTMLElement) => void | Promise<unknown>;
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
const TWEET_HYDRATION_ROOT_MARGIN = "900px 0px";
const TWEET_EMBED_SCALE = 0.84;
let twitterWidgetsScriptPromise: Promise<void> | null = null;
const SORT_MODE_STORAGE_KEY = "reading-board-sort-mode";
const CATEGORY_NAV_SCROLL_KEY = "reading-board-category-nav-scroll";

export function ReadingBoard({ readings, activeCategory }: ReadingBoardProps) {
  const router = useRouter();
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
    router.push(`/${categoryToSlug(category)}`, { scroll: false });
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
            <button
              key={id}
              type="button"
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
            </button>
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
      <div className={activeCategory === "Tweets" ? "mt-6 space-y-2" : "mt-6 space-y-1"}>
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

function TweetCard({ reading }: ReadingCardProps) {
  const [cardRef, isNearViewport] = useNearViewport<HTMLElement>();
  const embedRef = useRef<HTMLDivElement | null>(null);
  const tweetEmbedHtml = useMemo(
    () => normalizeTweetEmbedHtml(reading.tweetEmbedHtml),
    [reading.tweetEmbedHtml],
  );
  const tweetId = getTweetId(reading.link, tweetEmbedHtml);
  const tweetPreviewHtml = useMemo(
    () => (tweetEmbedHtml ? buildTweetPreviewHtml(tweetEmbedHtml) : undefined),
    [tweetEmbedHtml],
  );
  const isTweetEmbedRendered = useTwitterTweetEmbed(
    embedRef,
    tweetId,
    Boolean(tweetId) && isNearViewport,
  );

  const shouldShowPreview = !isNearViewport || !tweetId || !isTweetEmbedRendered;

  return (
    <article
      ref={cardRef}
      className="py-2"
    >
      <div className="mx-auto max-w-lg">
        {tweetEmbedHtml ? (
          <div className="tweet-shell">
            {shouldShowPreview && (
              <div
                className="tweet-preview"
                dangerouslySetInnerHTML={{ __html: tweetPreviewHtml ?? "" }}
              />
            )}
            {tweetId && isNearViewport && (
              <div
                ref={embedRef}
                className={
                  isTweetEmbedRendered
                    ? "tweet-embed"
                    : "tweet-embed tweet-embed-pending"
                }
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Tweet unavailable.{" "}
            <a
              href={reading.link}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2"
            >
              View on X
            </a>
          </p>
        )}
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

function isTweetReading(reading: Reading) {
  return reading.categories.includes("Tweets") || reading.type === "Tweet";
}

function useTwitterTweetEmbed(
  containerRef: RefObject<HTMLElement | null>,
  tweetId: string | undefined,
  shouldLoad: boolean,
) {
  const [renderedTweetId, setRenderedTweetId] = useState<string>();

  useEffect(() => {
    if (typeof window === "undefined" || !shouldLoad || !tweetId) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) return undefined;

    let isCancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    container.replaceChildren();
    container.style.removeProperty("height");

    const scaleFrame = document.createElement("div");
    scaleFrame.className = "tweet-embed-scale";
    container.appendChild(scaleFrame);

    const syncScaledHeight = () => {
      const height = scaleFrame.scrollHeight;
      if (height > 0) {
        container.style.height = `${Math.ceil(height * TWEET_EMBED_SCALE)}px`;
      }
    };

    const scheduleHeightSync = () => {
      requestAnimationFrame(syncScaledHeight);
      window.setTimeout(syncScaledHeight, 250);
      window.setTimeout(syncScaledHeight, 1000);
    };

    loadTwitterWidgetsScript()
      .then(() => {
        if (isCancelled) return undefined;
        const widgetPromise = window.twttr?.widgets?.createTweet(tweetId, scaleFrame, {
          dnt: true,
        });
        return widgetPromise?.then((widget) => {
          if (!isCancelled && widget) {
            scheduleHeightSync();
            if ("ResizeObserver" in window) {
              resizeObserver = new ResizeObserver(syncScaledHeight);
              resizeObserver.observe(scaleFrame);
            }
            setRenderedTweetId(tweetId);
          }
        });
      })
      .catch(() => {
        if (!isCancelled) {
          twitterWidgetsScriptPromise = null;
        }
      });

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
      container.style.removeProperty("height");
    };
  }, [containerRef, shouldLoad, tweetId]);

  return renderedTweetId === tweetId;
}

function useNearViewport<TElement extends HTMLElement>() {
  const elementRef = useRef<TElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    if (isNearViewport) return undefined;

    const element = elementRef.current;
    if (!element) return undefined;

    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setIsNearViewport(true), 0);
      return () => clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: TWEET_HYDRATION_ROOT_MARGIN },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isNearViewport]);

  return [elementRef, isNearViewport] as const;
}

function loadTwitterWidgetsScript() {
  if (window.twttr?.widgets) {
    return Promise.resolve();
  }

  if (twitterWidgetsScriptPromise) {
    return twitterWidgetsScriptPromise;
  }

  twitterWidgetsScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${TWITTER_WIDGETS_SRC}"]`,
    );

    const handleLoad = () => resolve();
    const handleError = () => {
      twitterWidgetsScriptPromise = null;
      reject(new Error("Failed to load Twitter widgets"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TWITTER_WIDGETS_SRC;
    script.async = true;
    script.charset = "utf-8";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.body.appendChild(script);
  });

  return twitterWidgetsScriptPromise;
}

function normalizeTweetEmbedHtml(html: string | undefined) {
  if (!html) return undefined;
  return stripScriptTags(html)
    .replace(/<blockquote\b(?![^>]*\bdata-dnt=)/i, '<blockquote data-dnt="true"')
    .trim();
}

function buildTweetPreviewHtml(html: string) {
  return removeClassToken(html, "twitter-tweet");
}

function getTweetId(link: string, tweetEmbedHtml: string | undefined) {
  const candidates = [link, tweetEmbedHtml].filter(
    (candidate): candidate is string => Boolean(candidate),
  );

  for (const candidate of candidates) {
    const match = candidate.match(/status(?:es)?\/(\d+)/i);
    if (match) return match[1];
  }

  return undefined;
}

function stripScriptTags(html: string) {
  return html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
}

function removeClassToken(html: string, className: string) {
  return html.replace(/\sclass=(["'])(.*?)\1/gi, (_match, quote, classes) => {
    const nextClasses = classes
      .split(/\s+/)
      .filter(Boolean)
      .filter((token: string) => token !== className)
      .join(" ");

    return nextClasses ? ` class=${quote}${nextClasses}${quote}` : "";
  });
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
