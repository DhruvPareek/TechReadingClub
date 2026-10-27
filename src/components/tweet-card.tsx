import "server-only";

import { unstable_cache } from "next/cache";
import Image from "next/image";
import { EmbeddedTweet, type TwitterComponents } from "react-tweet";
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
    <div className="tweet-card mx-auto">
      <div className="tweet-scale">
        {tweetId ? (
          <CachedTweet id={tweetId} fallback={fallback} />
        ) : fallback}
      </div>
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

  return tweet ? <EmbeddedTweet tweet={tweet} components={tweetComponents} /> : fallback;
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
