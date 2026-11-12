This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Configuration

This project loads all reading data from a Google Sheet via the Sheets API.
Create a `.env.local` file with the following keys before running the dev server:

```
GOOGLE_SHEETS_API_KEY=your_api_key
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
# Must include the header row and all columns, including optional `publishedDate`
GOOGLE_SHEETS_RANGE=Sheet1!A1:I
```

To seed a blank spreadsheet, import
[`research/readings-with-publication-dates.csv`](research/readings-with-publication-dates.csv).
The default sheet name is usually `Sheet1`; update `GOOGLE_SHEETS_RANGE` to match
your tab name (`readings` for the live sheet).

Readings default to newest publication date first. The inline **Sort by** controls
offer **Order added** and **Publish date**, with the active choice underlined.
Click **Publish date** again to toggle newest/oldest first; the arrow shows the
current direction.
**Order added** follows the spreadsheet rows from bottom to top within the current
category; it does not require an added-date column. Reordering spreadsheet rows
also changes this order. The selection persists across categories and reloads
within the browser session.
Tweets retain their existing order. The `rating` column remains in the spreadsheet
but is no longer displayed or used for sorting.

The live sheet uses columns A:I: `id`, `title`, `author`, `type`, `link`, `rating`,
`publishedDate`, `categories`, and `tweetEmbedHtml`. The empty `summary` column
was deleted, and `reviewDate` was replaced with `publishedDate` in column G.
Enter dates such as `2024-06-15`. The headers `Published Date` and `Publish Date`
also work. Include all nine columns in `GOOGLE_SHEETS_RANGE` in each environment.
Sheet values take precedence over the researched dates in
[`src/data/publication-dates.json`](src/data/publication-dates.json), which are
matched by ID and title. No example dates are used.

The [publication date CSV](research/publication-dates.csv) covers all 180
non-tweet entries from the November 6, 2026 sheet snapshot. It includes original
sheet row numbers, titles, dates, precision, source links, evidence, and notes.
All 180 entries have a date: 178 sourced dates and two dates supplied by the site
owner: September 14, 2024 for the MrBeast handbook and November 15, 2025 for the
WSJ Cody Campbell article. Row numbers are a reference for
that snapshot; match by both ID and title when importing into a changed sheet.
All 180 publication dates have been written to the live sheet, with the 88 tweet
date cells left blank. Month-only and year-only dates are stored as plain text
to preserve their precision. Existing row order and other columns are unchanged.

Books use original publication dates where established, including original
language editions, rather than later reprints. Edition differences and
conflicting sources are recorded in the notes. Articles use original publication
dates rather than modification, archive capture, or date-added timestamps.

Full dates display as MM/DD/YYYY, month-only dates as MM/YYYY, and year-only
dates as YYYY. Enter partial dates as plain text (`2024-06` or `1969`) so Sheets
does not invent a day; full dates can also use MM/DD/YYYY. Partial dates sort at
the start of the known month or year. Missing or invalid dates display an em dash
and sort last in either direction. The author line displays `Author · Essay`.

### Development server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
