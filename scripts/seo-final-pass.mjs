// Final metadata pass: runs last in prebuild so generated pages keep distinct titles/descriptions
// and the sitemap never lists redirecting aliases. Config lives in data/seo-final-pass.json.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cfgFile = path.join(root, "data", "seo-final-pass.json");
if (!fs.existsSync(cfgFile)) process.exit(0);
const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
const titles = cfg.titles || {};
const sitemapRemove = new Set((cfg.sitemapRemove || []).map((r) => r.replace(/\/+$/, "") || "/"));

const SKIP = new Set(["node_modules", ".next", ".git", ".vercel"]);
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function canonicalRoute(html) {
  const m = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i);
  const href = m && m[0].match(/\bhref=["']([^"']+)/i)?.[1];
  if (!href) return null;
  try {
    return new URL(href).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return href.replace(/\/+$/, "") || "/";
  }
}

function routeOfFile(file, html) {
  const fromCanon = canonicalRoute(html);
  if (fromCanon) return fromCanon;
  const rel = path.relative(root, file).split(path.sep).join("/");
  let m;
  if ((m = rel.match(/^public\/__static-pages\/(.+)\.html$/)) || (m = rel.match(/^data\/rendered-pages\/(.+)\.html$/)) || (m = rel.match(/^rendered\/pages\/(.+)\.html$/))) {
    const r = "/" + m[1].replace(/__/g, "/");
    return r === "/index" ? "/" : r;
  }
  if ((m = rel.match(/^(?:\.site\/pages|public\/rendered)\/(.+)\/index\.html$/))) return "/" + m[1];
  return null;
}

let changed = 0;
if (Object.keys(titles).length) {
  const dirs = ["public", "data/rendered-pages", "data/leak-first-rendered", "data/audit-recovered-pages", "rendered", ".site/pages"];
  for (const file of dirs.flatMap((d) => walk(path.join(root, d))).filter((f) => f.endsWith(".html"))) {
    const before = fs.readFileSync(file, "utf8");
    const route = routeOfFile(file, before);
    const t = route && titles[route];
    if (!t) continue;
    let html = before;
    // Order-independent per-tag rewrite; attribute values are matched with a backreference so apostrophes survive.
    const setTag = (tag, value) => tag.replace(/(\bcontent=)(["'])(?:(?!\2)[\s\S])*\2/i, (_m, pre) => `${pre}"${esc(value)}"`);
    html = html.replace(/<meta\b[^>]*>/gi, (tag) => {
      const key = (tag.match(/\b(?:name|property)=["']([^"']+)["']/i) || [])[1];
      if (!key) return tag;
      const k = key.toLowerCase();
      if (t.title && (k === "og:title" || k === "twitter:title")) return setTag(tag, t.title);
      if (t.description && (k === "description" || k === "og:description" || k === "twitter:description")) return setTag(tag, t.description);
      return tag;
    });
    if (t.title) html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escText(t.title)}</title>`);
    if (html !== before) {
      fs.writeFileSync(file, html);
      changed++;
    }
  }
}

const redirects = cfg.redirects || [];
const vercelFile = path.join(root, "vercel.json");
if (redirects.length && fs.existsSync(vercelFile)) {
  const raw = fs.readFileSync(vercelFile, "utf8");
  const v = JSON.parse(raw);
  v.redirects = v.redirects || [];
  const have = new Set(v.redirects.map((r) => (r.source || "").replace(/(.)\/+$/, "$1")));
  const add = [];
  for (const r of redirects) {
    const src = r.source.replace(/(.)\/+$/, "$1");
    if (have.has(src)) continue;
    add.push({ source: src, destination: r.destination, permanent: true });
  }
  if (add.length) {
    v.redirects = [...add, ...v.redirects];
    fs.writeFileSync(vercelFile, JSON.stringify(v, null, 2) + "\n");
    changed++;
  }
}

const sitemapFile = path.join(root, "public", "sitemap.xml");
if (sitemapRemove.size && fs.existsSync(sitemapFile)) {
  const before = fs.readFileSync(sitemapFile, "utf8");
  const after = before.replace(/[ \t]*<url>(?:(?!<\/url>)[\s\S])*?<\/url>[ \t]*\r?\n?/g, (block) => {
    const loc = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (!loc) return block;
    let p;
    try {
      p = new URL(loc.replace(/&amp;/g, "&")).pathname.replace(/\/+$/, "") || "/";
    } catch {
      return block;
    }
    return sitemapRemove.has(p) ? "" : block;
  });
  if (after !== before) {
    fs.writeFileSync(sitemapFile, after);
    changed++;
  }
}
console.log(`SEO final pass updated ${changed} files`);
