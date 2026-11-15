# itolmach.com

Static site for [itolmach.com](https://itolmach.com), hosted on GitHub Pages, with DNS at
GoDaddy. It is a scrape of the Letter replica of the Framer site
(`https://a397b93581c5991cfadb25bb3af951b4.preview.letter.dev`), with the replica's
Next.js/React runtime removed. No framework, no build step, no dependencies.

```
index.html               home
work/index.html          work overview
work/<case>/index.html   airbrake, linggo, metricfire, nova, onfleet
404.html                 not-found page (GitHub Pages serves it automatically)
css/site.css             shared component styles and @font-face rules
css/home.css, work.css, work-item.css, 404.css   page-specific styles
js/site.js               scroll reveal animations (vanilla JS)
assets/                  images, fonts
CNAME, .nojekyll         GitHub Pages config
scripts/                 scrape + verification tooling (not needed to serve the site)
```

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Paths are root-absolute, so serve the folder from the root of
a domain.

## Hosting: GitHub Pages + GoDaddy DNS

1. **GitHub:** repo **Settings → Pages**. Under *Build and deployment*, choose *Deploy from a
   branch*, pick the branch and `/ (root)`, then save. The `CNAME` file sets the custom domain
   to `itolmach.com`.
2. **GoDaddy:** **My Products → itolmach.com → DNS**.
   - Delete the two `A` records for `@` that point to Framer (`31.43.160.6`, `31.43.161.6`).
   - Add four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
     `185.199.111.153`.
   - Optional IPv6: four `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`,
     `2606:50c0:8002::153`, `2606:50c0:8003::153`.
   - Change the `www` `CNAME` from `sites.framer.app` to `itolmach.github.io`.
3. **Back in Settings → Pages:** once the certificate is issued, tick **Enforce HTTPS**.
4. **Recommended:** verify the domain under your GitHub account's **Settings → Pages →
   Add a domain**.

## Fidelity

`scripts/compare_to_preview.js` screenshots each page on the preview and locally at
1440/1000/390 px. All 8 pages match pixel for pixel. The one exception is a few hundred pixels
on /work/airbrake, from an animated GIF whose frame differs between any two loads, including
two loads of the live preview.

## Changes from the Framer original

- The Onfleet case study's "Visit Website" button linked to the Framer template demo
  (`shirotemplate.framer.website`). It now links to onfleet.com.

## Scripts

```bash
python3 scripts/letter_to_static.py <letter-preview-url> <out-dir>
node scripts/compare_to_preview.js <letter-preview-url> http://localhost:8000 / /work /404
```

Re-running the scraper into this repo overwrites manual edits, so only do that to start over
from Letter.
