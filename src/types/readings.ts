export const CATEGORY_ORDER = [
  "Companies",
  "People",
  "Technical",
  "Economics",
  "Tweets",
  "Misc.",
] as const;

export type Category = (typeof CATEGORY_ORDER)[number];

export type ReadingType = "Book" | "Essay" | "Profile" | "Tweet";

export type Reading = {
  id: string;
  title: string;
  author: string;
  type: ReadingType;
  link: string;
  rating: 0 | 1 | 2 | 3 | 4 | 5;
  summary?: string;
  reviewDate: string;
  categories: Category[];
  tweetEmbedHtml?: string;
};

export type CategoryDescriptor = {
  id: Category;
  label: string;
};

export const CATEGORY_SLUGS: Record<Category, string> = {
  Companies: "companies",
  People: "people",
  Technical: "technical",
  Economics: "economics",
  Tweets: "tweets",
  "Misc.": "misc",
};

const SLUG_TO_CATEGORY = Object.entries(CATEGORY_SLUGS).reduce<
  Record<string, Category>
>((acc, [category, slug]) => {
  acc[slug] = category as Category;
  return acc;
}, {});

export function categoryToSlug(category: Category) {
  return CATEGORY_SLUGS[category];
}

export function isCategory(value: string): value is Category {
  return CATEGORY_ORDER.includes(value as Category);
}

export function categoryFromSlug(slug: string | undefined | null) {
  if (!slug) return null;
  return SLUG_TO_CATEGORY[slug.toLowerCase()] ?? null;
}

export const CATEGORY_DESCRIPTORS: CategoryDescriptor[] = [
  {
    id: "Companies",
    label: "Companies",
  },
  {
    id: "People",
    label: "People",
  },
  {
    id: "Technical",
    label: "Technical",
  },
  {
    id: "Economics",
    label: "Economics",
  },
  {
    id: "Tweets",
    label: "Tweets",
  },
  {
    id: "Misc.",
    label: "Misc.",
  },
];

