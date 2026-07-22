# Get OutreachOS into Google Search

Canonical site: **https://outreachos.techxtreme.me**

The app already ships sitemap, robots, metadata, and JSON-LD. Google still needs you to claim the property and nudge a crawl.

## 1. Search Console property

Two fine options:

**A. Domain property (`techxtreme.me`)** — covers every subdomain, including OutreachOS. Verify with a DNS TXT at your registrar. This is what we’re using.

**B. URL-prefix** — `https://outreachos.techxtreme.me` only. HTML tag verification works via:

```text
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<content value from Search Console>
```

Redeploy after setting it. The app puts that into `<meta name="google-site-verification">`.

## 2. Submit the sitemap

Sitemaps → add:

`https://outreachos.techxtreme.me/sitemap.xml`

Sanity checks:

- https://outreachos.techxtreme.me/robots.txt
- https://outreachos.techxtreme.me/sitemap.xml

## 3. Request indexing (a few key URLs)

URL Inspection → Request indexing (don’t spam it):

1. `/`
2. `/pricing`
3. `/import-guide`
4. `/auth/signup`

## 4. Timing

| Query | Rough expectation |
| --- | --- |
| `OutreachOS` | Days to a few weeks after indexing |
| Broad phrases like “lead management vault” | Slow; needs links + more public pages |

Brand search comes first. Broad ranking isn’t something code alone guarantees.

## 5. Extra links that help

- Portfolio: [techxtreme.me](https://techxtreme.me) / case study `/work/outreachos`
- GitHub repo homepage + README
- Bio / social if you use them

## Env (Vercel Production)

```text
NEXT_PUBLIC_APP_URL=https://outreachos.techxtreme.me
NEXT_PUBLIC_SITE_URL=https://outreachos.techxtreme.me
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=  # only if using HTML-tag verify
```
