# Get OutreachOS into Google Search

Canonical site: **https://outreachos.techxtreme.me**

Technical SEO (sitemap, robots, metadata, JSON-LD) ships with the app. Google still will not list you until you **claim the property** and ask it to crawl.

## 1. Add the site in Google Search Console (required — you do this)

1. Open [Google Search Console](https://search.google.com/search-console)
2. **Add property** → choose **URL prefix**
3. Enter exactly: `https://outreachos.techxtreme.me`
4. Verify ownership (pick one):
   - **HTML tag**: copy the `content="…"` value → set Vercel env  
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<that value>` → redeploy  
     (the app already reads this into `<meta name="google-site-verification">`)
   - **DNS TXT** on `techxtreme.me` at Namecheap (works for the whole domain)
5. Click **Verify**

## 2. Submit the sitemap

After verification:

1. Left menu → **Sitemaps**
2. Add: `https://outreachos.techxtreme.me/sitemap.xml`
3. Submit

Live checks:

- https://outreachos.techxtreme.me/robots.txt
- https://outreachos.techxtreme.me/sitemap.xml

## 3. Request indexing for key pages

**URL Inspection** → paste each URL → **Request indexing**:

1. `https://outreachos.techxtreme.me/`
2. `https://outreachos.techxtreme.me/pricing`
3. `https://outreachos.techxtreme.me/import-guide`
4. `https://outreachos.techxtreme.me/auth/signup`

Do a few per day; Google rate-limits requests.

## 4. What to expect

| Query | Realistic timing |
| --- | --- |
| `OutreachOS` / `outreachos` | Days–weeks after indexing (brand match) |
| `lead management vault` | Weeks–months; competitive; needs backlinks + more pages |

Ranking top 5–7 for broad phrases is **not** guaranteed by code alone. Brand search (`OutreachOS`) is the first win.

## 5. Optional boosts

- Link **https://outreachos.techxtreme.me** from your portfolio (`techxtreme.me` / `.is-a.dev`), GitHub README, and social bios
- Keep publishing useful public pages (guides beat empty shells)
- Bing Webmaster can ingest the same sitemap (feeds some AI surfaces)

## Env reminder (Vercel Production)

```text
NEXT_PUBLIC_APP_URL=https://outreachos.techxtreme.me
NEXT_PUBLIC_SITE_URL=https://outreachos.techxtreme.me
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=  # paste from Search Console HTML tag
```
