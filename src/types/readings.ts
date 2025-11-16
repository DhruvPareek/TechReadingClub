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
  rating: 1 | 2 | 3 | 4 | 5;
  summary?: string;
  reviewDate: string;
  categories: Category[];
  tweetEmbedHtml?: string;
};

export type CategoryDescriptor = {
  id: Category;
  label: string;
};

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

