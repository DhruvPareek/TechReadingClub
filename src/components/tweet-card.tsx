import "server-only";

import { unstable_cache } from "next/cache";
import Image from "next/image";
import { EmbeddedTweet, enrichTweet, getMediaUrl, type TwitterComponents } from "react-tweet";
import { getTweet } from "react-tweet/api";
import type { Reading } from "@/types/readings";

// Let request failures escape the cache so temporary outages are retried.
const getCachedTweet = unstable_cache(
  (id: string) => getTweet(id, { signal: AbortSignal.timeout(5000) }),
  ["reading-club-tweet"],
  { revalidate: 60 * 60 * 24 },
);

const tweetComponents: TwitterComponents = {
  MediaImg: (props) => (
    <Image
      {...props}
      alt={props.alt}
      fill
      unoptimized
      sizes="(max-width: 544px) calc(100vw - 64px), 480px"
    />
  ),
};

export function TweetCard({ reading }: { reading: Reading }) {
  const tweetId = [reading.link, reading.tweetEmbedHtml]
    .map((value) => value?.match(/status(?:es)?\/(\d+)/i)?.[1])
    .find(Boolean);
  const fallback = <TweetFallback reading={reading} tweetId={tweetId} />;

  return (
    <div className="tweet-card mx-auto max-w-xl">
      {tweetId ? (
        <CachedTweet id={tweetId} fallback={fallback} />
      ) : fallback}
    </div>
  );
}

async function CachedTweet({
  id,
  fallback,
}: {
  id: string;
  fallback: React.ReactNode;
}) {
  let tweet;
  try {
    tweet = await getCachedTweet(id);
  } catch (error) {
    console.error(`Failed to load tweet ${id}`, error);
    return fallback;
  }

  if (!tweet) return fallback;

  const enriched = enrichTweet(tweet);
  const entities = enriched.entities.filter((entity) => entity.type !== "media");
  const media = tweet.mediaDetails?.[0] ?? tweet.quoted_tweet?.mediaDetails?.[0];
  const date = new Date(tweet.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });

  return (
    <details className="tweet-disclosure">
      <summary className="tweet-summary">
        <div className="tweet-preview">
          <div className="tweet-preview-header">
            <Image
              src={tweet.user.profile_image_url_https}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="tweet-preview-avatar"
            />
            <div className="tweet-preview-author">
              <strong>{tweet.user.name}</strong>
              <span>@{tweet.user.screen_name}</span>
            </div>
            <time dateTime={tweet.created_at}>{date}</time>
          </div>
          <div className="tweet-preview-content">
            <p className="tweet-preview-text" lang={tweet.lang} dir="auto">
              {entities.map((entity, index) => entity.type === "text" ? (
                <span key={index} dangerouslySetInnerHTML={{ __html: entity.text }} />
              ) : (
                <span key={index} className="tweet-preview-link">{entity.text}</span>
              ))}
              {!entities.some((entity) => entity.text.trim()) && (media?.type === "photo" ? "Photo" : "View tweet")}
            </p>
            {media && (
              <div className="tweet-preview-media">
                <Image src={getMediaUrl(media, "small")} alt="" fill unoptimized sizes="112px" />
                {media.type !== "photo" && <span className="tweet-preview-video">Video</span>}
              </div>
            )}
          </div>
          {tweet.quoted_tweet && (
            <div className="tweet-preview-quote">Quotes @{tweet.quoted_tweet.user.screen_name}</div>
          )}
        </div>
        <span className="tweet-expand-label">Expand tweet <span aria-hidden="true">⌄</span></span>
        <span className="tweet-collapse-label">Collapse tweet <span aria-hidden="true">⌃</span></span>
      </summary>
      <EmbeddedTweet tweet={tweet} components={tweetComponents} />
    </details>
  );
}

function TweetFallback({ reading, tweetId }: { reading: Reading; tweetId?: string }) {
  // Keep sheet content readable when X is slow or the tweet is unavailable.
  const html = reading.tweetEmbedHtml
    ?.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\btwitter-tweet\b/g, "")
    .trim();
  const url = tweetId ? `https://x.com/i/status/${tweetId}` : reading.link;

  return (
    <article className="tweet-fallback">
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <>
          <p>{reading.summary || reading.title || "Tweet unavailable."}</p>
          {url && <a href={url} target="_blank" rel="noreferrer">View on X</a>}
        </>
      )}
    </article>
  );
}
