"use server";

import "server-only";

import { cache } from "react";
import publicationDates from "@/data/publication-dates.json";
import {
  CATEGORY_ORDER,
  type Category,
  type Reading,
  type ReadingType,
  isCategory,
} from "@/types/readings";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const REVALIDATE_SECONDS = 60 * 5; // 5 minutes
const CATEGORY_FALLBACK: Category = "Misc.";
// One ID is shared by two different readings in the sheet; include the title.
const PUBLICATION_DATE_BY_READING = new Map(
  publicationDates.map(({ id, title, publishedDate }) => [
    JSON.stringify([id.trim(), title.trim()]),
    publishedDate,
  ]),
);

const NORMALIZED_HEADER = {
  id: normalizeKey("id"),
  title: normalizeKey("title"),
  author: normalizeKey("author"),
  type: normalizeKey("type"),
  link: normalizeKey("link"),
  summary: normalizeKey("summary"),
  reviewDate: normalizeKey("reviewDate"),
  publishedDate: normalizeKey("publishedDate"),
  categories: normalizeKey("categories"),
  tweetEmbedHtml: normalizeKey("tweetEmbedHtml"),
} as const;

type HeaderMap = Record<string, number>;

const VALID_READING_TYPES: ReadonlyArray<ReadingType> = [
  "Book",
  "Essay",
  "Profile",
  "Tweet",
];

function normalizeKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function buildHeaderMap(headerRow: string[]): HeaderMap {
  return headerRow.reduce<HeaderMap>((acc, columnName, index) => {
    const normalized = normalizeKey(columnName);
    if (normalized) {
      acc[normalized] = index;
    }
    return acc;
  }, {});
}

function extractValue(row: string[], headerMap: HeaderMap, key: string) {
  const index = headerMap[key];
  return typeof index === "number" ? row[index] ?? "" : "";
}

function parseReadingType(value: string): ReadingType {
  if (VALID_READING_TYPES.includes(value as ReadingType)) {
    return value as ReadingType;
  }
  return "Book";
}

function parseCategories(value: string): Category[] {
  const cleaned = value
    .split(/[\|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const categories = cleaned.filter(isCategory);
  if (categories.length > 0) {
    return categories;
  }
  return [CATEGORY_FALLBACK];
}

function mapRowToReading(row: string[], headerMap: HeaderMap): Reading | null {
  const id = extractValue(row, headerMap, NORMALIZED_HEADER.id).trim();
  const rawTitle = extractValue(row, headerMap, NORMALIZED_HEADER.title).trim();
  if (!id) {
    return null;
  }
  const title = rawTitle || id;

  const categoriesRaw = extractValue(row, headerMap, NORMALIZED_HEADER.categories);
  const categories = parseCategories(categoriesRaw);

  return {
    id,
    title,
    author: extractValue(row, headerMap, NORMALIZED_HEADER.author).trim(),
    type: parseReadingType(
      extractValue(row, headerMap, NORMALIZED_HEADER.type).trim(),
    ),
    link: extractValue(row, headerMap, NORMALIZED_HEADER.link).trim(),
    summary: (() => {
      const value = extractValue(row, headerMap, NORMALIZED_HEADER.summary).trim();
      return value ? value : undefined;
    })(),
    reviewDate: extractValue(row, headerMap, NORMALIZED_HEADER.reviewDate).trim(),
    publishedDate:
      extractValue(row, headerMap, NORMALIZED_HEADER.publishedDate).trim() ||
      extractValue(row, headerMap, normalizeKey("Publish Date")).trim() ||
      PUBLICATION_DATE_BY_READING.get(JSON.stringify([id, title])) ||
      undefined,
    categories,
    tweetEmbedHtml: (() => {
      const value = extractValue(
        row,
        headerMap,
        NORMALIZED_HEADER.tweetEmbedHtml,
      ).trim();
      return value ? value : undefined;
    })(),
  };
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function requestSheetValues() {
  const apiKey = getRequiredEnv("GOOGLE_SHEETS_API_KEY");
  const spreadsheetId = getRequiredEnv("GOOGLE_SHEETS_SPREADSHEET_ID");
  const range = process.env.GOOGLE_SHEETS_RANGE ?? "readings!A1:I";

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
    range,
  )}?key=${apiKey}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to load Google Sheet: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as { values?: string[][] };
}

export const fetchReadingsFromSheet = cache(
  async (): Promise<ReadonlyArray<Reading>> => {
    const data = await requestSheetValues();
    const rows = data.values ?? [];
    if (rows.length === 0) {
      return [];
    }

    const [headerRow, ...dataRows] = rows;
    const headerMap = buildHeaderMap(headerRow);
    const readings = dataRows
      .map((row) => mapRowToReading(row, headerMap))
      .filter((reading): reading is Reading => Boolean(reading));

    return readings.map((reading) => ({
      ...reading,
      categories: reading.categories.sort(
        (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
      ),
    }));
  },
);

