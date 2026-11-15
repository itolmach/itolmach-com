#!/usr/bin/env python3
"""Download a Letter (letter.dev) replica and turn it into a plain static site.

A Letter replica is a Next.js app whose pages are pre-rendered HTML. Apart from the
React/Next runtime, the only site-specific JavaScript is a client chunk holding small
DOM components (scroll reveals, scroll direction, slideshows...). This script keeps the
rendered HTML, CSS and assets, drops the runtime and the RSC payload, and turns those
components into a standalone js/site.js.

usage: python3 scripts/letter_to_static.py <preview-url> <out-dir>

Needs curl and node on PATH (npx is optional, used to pretty-print js/site.js).
Writes <out-dir>/index.html, <out-dir>/<page>/index.html, 404.html, css/, js/, assets/.
"""
import json, os, re, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

base, out = sys.argv[1].rstrip("/"), os.path.abspath(sys.argv[2])
work = tempfile.mkdtemp(prefix="letter-")


def get(path, dest, ok404=False):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    code = subprocess.run(["curl", "-sS", "-o", dest, "-w", "%{http_code}", base + path],
                          capture_output=True, text=True).stdout
    if code != "200" and not (ok404 and code == "404"):
        raise SystemExit(f"GET {path} -> {code}")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)


# --- 1. pages ----------------------------------------------------------------------------
get("/sitemap.xml", f"{work}/sitemap.xml")
paths = sorted({urlparse(u).path.rstrip("/") or "/" for u in re.findall(r"<loc>([^<]+)</loc>", read(f"{work}/sitemap.xml"))})
paths = [p for p in paths if p != "/404"]
pages = {}  # path -> raw html
for p in paths:
    get(p if p != "/" else "/", f"{work}/raw{p}/index.html")
    pages[p] = read(f"{work}/raw{p}/index.html")
get("/404", f"{work}/raw/404.html", ok404=True)  # Next serves its not-found page with a 404
pages["/404"] = read(f"{work}/raw/404.html")
print(f"{len(pages)} pages:", ", ".join(pages))

# --- 2. assets and chunks ----------------------------------------------------------------
URL = re.compile(r"(/(?:_next/static|assets)/[^\"'\\\s,)&]+)")


def urls_in(s):
    return set(URL.findall(s.replace("\\u0026", "&").replace("&#x27;", "'")))


def fetch_all(urls):
    todo = [u for u in urls if not os.path.exists(work + u.split("?")[0])]
    with ThreadPoolExecutor(12) as ex:
        list(ex.map(lambda u: get(u, work + u.split("?")[0]), todo))


def strip_rsc(html):  # the RSC payload splits strings across chunks; only the rendered markup matters
    return re.sub(r"<script>\(?self\.__next_f.*?</script>", "", html, flags=re.S)


fetch_all(set().union(*(urls_in(strip_rsc(h)) for h in pages.values())))
chunks = f"{work}/_next/static/chunks"
css_files = [f for f in os.listdir(chunks) if f.endswith(".css")]
fetch_all({u for f in css_files for u in re.findall(r"url\((/assets/[^)\"']+)\)", read(f"{chunks}/{f}"))})

# --- 3. stylesheets: give the hashed chunks readable names --------------------------------
def sheets(html):
    return re.findall(r'<link rel="stylesheet" href="/_next/static/chunks/([^"]+\.css)"', html)


used_by = {}
for p, html in pages.items():
    for c in sheets(html):
        used_by.setdefault(c, []).append(p)
CSS = {}
for c, ps in used_by.items():
    if len(ps) == len(pages) or set(ps) >= set(paths):  # shared by every page
        CSS[c] = "motion.css" if "--spring-" in read(f"{chunks}/{c}")[:200] else "site.css"
    elif len(ps) > 1:  # e.g. every /work/* case study -> work-item.css
        CSS[c] = (os.path.commonpath(ps).strip("/").replace("/", "-") or "shared") + "-item.css"
    else:
        CSS[c] = ("404" if ps[0] == "/404" else ps[0].strip("/").replace("/", "-") or "home") + ".css"
assert len(set(CSS.values())) == len(CSS), CSS

# --- 4. js/site.js: the site's own client components, without React -----------------------
EXTRACT = r"""
const fs = require('fs'), found = [];
globalThis.document = {}; // chunks read document.currentScript when pushed
globalThis.TURBOPACK = { push(entry) {
  for (let i = 1; i < entry.length; i += 2) {
    const src = String(entry[i + 1]);
    if (/usePathname/.test(src) && /useEffect/.test(src) && /document\.querySelector/.test(src)) found.push(src);
  }
}};
for (const f of process.argv.slice(2)) { try { require(f); } catch (e) {} }
process.stdout.write(JSON.stringify(found));
"""
js_files = [f"{chunks}/{f}" for f in os.listdir(chunks)
            if f.endswith(".js") and not f.startswith("turbopack-") and "usePathname" in read(f"{chunks}/{f}")]
mods = json.loads(subprocess.run(["node", "-e", EXTRACT, *js_files], capture_output=True, text=True, check=True).stdout)
assert mods, "no site client components found"
site_js = (
    "// Site runtime: scroll reveals, scroll direction, scroll/click interactions, parallax,\n"
    "// dropdowns, tabs and slideshows. These are the replica's Next.js client components,\n"
    "// run once on load with tiny stand-ins for the React and Next hooks they import.\n"
    "(function () {\n"
    "  const hooks = { usePathname: () => location.pathname, useEffect: (effect) => effect() };\n"
    "  const runtime = {\n"
    "    i: () => hooks, // module imports (react, next/navigation)\n"
    "    r: () => hooks,\n"
    "    s: (exports) => exports.filter((x) => typeof x === 'function').forEach((component) => component()),\n"
    "  };\n"
    + "".join(f"  ({m})(runtime);\n" for m in mods)
    + "})();\n"
)

# --- 5. clean the HTML ---------------------------------------------------------------------
def clean(html, page):
    def script(m):
        attrs, body = m.group(1), m.group(2)
        if "src=" in attrs and "/_next/" in attrs:
            return ""  # Next/React runtime
        if body.startswith(("self.__next_f", "(self.__next_f", "var animator=", "typeof document<\"u\"&&(window.process")):
            return ""  # RSC payload, unused Framer appear-animator, NODE_ENV shim
        if "data-nested-link" in body or 'querySelectorAll("#main a")' in body:
            return m.group(0)  # small vanilla helpers: nested links, relative links on 404: keep
        print(f"  note: keeping unknown inline script on {page}: {body[:80]!r}")
        return m.group(0)

    html = re.sub(r"<script([^>]*)>(.*?)</script>", script, html, flags=re.S)
    html = re.sub(r'<link rel="preload" as="script"[^>]*/>', "", html)
    html = re.sub(r'<link rel="preload" href="/_next/[^"]*" as="style"/>', "", html)
    html = re.sub(r'<div hidden="">(?:<!--/?\$-->)*</div>', "", html)
    html = re.sub(r"<!--/?\$\??-->", "", html)
    html = html.replace(' data-precedence="next"', "")
    for old, new in CSS.items():
        html = html.replace(f"/_next/static/chunks/{old}", f"/css/{new}")
    html = html.replace("</head>", '<script src="/js/site.js" defer></script></head>', 1)
    leftovers = re.findall(r".{40}(?:_next|preview\.letter\.dev).{40}", html)
    assert not leftovers, (page, leftovers[:3])
    return html


for d in ("css", "js", "assets"):
    shutil.rmtree(f"{out}/{d}", ignore_errors=True)
for p, html in pages.items():
    write(f"{out}/404.html" if p == "/404" else f"{out}{p.rstrip('/')}/index.html", clean(html, p))
for old, new in CSS.items():
    os.makedirs(f"{out}/css", exist_ok=True)
    shutil.copy(f"{chunks}/{old}", f"{out}/css/{new}")
write(f"{out}/js/site.js", site_js)
shutil.copytree(f"{work}/assets", f"{out}/assets")
if shutil.which("npx"):
    subprocess.run(["npx", "-y", "prettier@3.3.3", "--parser", "babel", "--write", f"{out}/js/site.js"],
                   capture_output=True)
subprocess.run(["node", "--check", f"{out}/js/site.js"], check=True)
shutil.rmtree(work)
print("built", out, "| css:", ", ".join(sorted(CSS.values())))
