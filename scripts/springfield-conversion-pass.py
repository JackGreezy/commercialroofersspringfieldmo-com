#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]).resolve()
PUBLIC = ROOT / "public"
PHONE = "555-555-6137"
PHONE_TEL = "+15555556137"
MAP_SRC = "https://www.google.com/maps?q=300+S+Jefferson+Ave%2C+Suite+900%2C+Springfield%2C+MO+65806&output=embed"


def fragment(markup: str):
    return BeautifulSoup(markup, "html.parser").find()


def set_meta(soup: BeautifulSoup, selector: str, value: str, attr: str = "content") -> None:
    tag = soup.select_one(selector)
    if tag:
        tag[attr] = value


def remove_fake_phone(soup: BeautifulSoup) -> None:
    for anchor in list(soup.find_all("a", href=re.compile(r"(?:\+?1)?5555556137"))):
        parent = anchor.parent
        if parent and parent.name in {"p", "li", "div"} and "555-555-6137" in parent.get_text(" ", strip=True):
            parent.decompose()
        else:
            anchor.decompose()
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue

        def clean(value):
            if isinstance(value, dict):
                return {
                    key: clean(item)
                    for key, item in value.items()
                    if not (key == "telephone" and (not str(item).strip() or PHONE in str(item)))
                }
            if isinstance(value, list):
                return [clean(item) for item in value]
            return value

        script.string = json.dumps(clean(data), separators=(",", ":"))
    for text in list(soup.find_all(string=re.compile(re.escape(PHONE)))):
        text.replace_with(re.sub(rf"(?:Phone:\s*)?{re.escape(PHONE)}", "", str(text), flags=re.I))


def restore_map(soup: BeautifulSoup) -> None:
    footer = soup.find("footer")
    if not footer:
        return
    for extra in list(soup.select("[data-rh-map]")):
        if "rr-footer-map" not in (extra.get("class") or []):
            extra.decompose()
    holder = footer.select_one(".rr-footer-map")
    if not holder:
        holder = soup.new_tag("div")
        holder["class"] = ["rr-footer-map"]
        holder["data-rr-footer-map"] = ""
        footer.append(holder)
    holder.clear()
    frame = soup.new_tag("iframe")
    frame["src"] = MAP_SRC
    frame["title"] = "Commercial Roofers of Springfield office map"
    frame["loading"] = "lazy"
    frame["referrerpolicy"] = "no-referrer-when-downgrade"
    frame["allowfullscreen"] = ""
    holder.append(frame)


def rewrite_home(soup: BeautifulSoup) -> None:
    title = "Commercial Roofing Springfield MO | Emergency Repair & Flat Roofs"
    description = (
        "Commercial roof emergency repair, flat roof inspections, coatings, replacement, "
        "and service agreements for Springfield and Southwest Missouri buildings."
    )
    if soup.title:
        soup.title.string = title
    set_meta(soup, 'meta[name="description"]', description)
    set_meta(soup, 'meta[property="og:title"]', title)
    set_meta(soup, 'meta[property="og:description"]', description)
    set_meta(soup, 'meta[name="twitter:title"]', title)
    set_meta(soup, 'meta[name="twitter:description"]', description)
    if soup.body:
        soup.body["class"] = list(dict.fromkeys((soup.body.get("class") or []) + ["rr-sgf-home"]))

    shell = soup.select_one(".page-content > .elementor")
    if not shell:
        return
    if not soup.select_one(".rr-sgf-hero"):
        shell.insert(0, fragment('''
<section class="rr-sgf-hero">
  <div class="rr-sgf-hero-image" role="img" aria-label="Commercial roofing in Springfield, Missouri"></div>
  <div class="rr-sgf-hero-panel">
    <p>Springfield commercial roof response</p>
    <h1>When the Roof Is Urgent, the Next Step Should Be Clear.</h1>
    <div class="rr-sgf-hero-copy">Get help with active leaks, storm damage, flat roof inspections, coatings, reroofing, and replacement planning for occupied commercial buildings.</div>
    <div class="rr-sgf-actions"><a href="/contact?service=emergency-repair">Get Emergency Roof Help</a><a href="/contact?service=flat-roof-inspection">Schedule a Flat Roof Inspection</a></div>
  </div>
</section>
'''))
    if not soup.select_one(".rr-sgf-entry-rail"):
        hero = soup.select_one(".rr-sgf-hero")
        hero.insert_after(fragment('''
<section class="rr-sgf-entry-rail">
  <a href="/contact?service=emergency-repair"><span>Active leak or storm damage</span><strong>Get the building dry and document the failure.</strong></a>
  <a href="/contact?service=flat-roof-inspection"><span>Flat roof decision coming up</span><strong>See what is repairable and what is not.</strong></a>
  <a href="/contact?service=service-agreement"><span>Too many roof surprises</span><strong>Put inspections and response into one service plan.</strong></a>
</section>
'''))

    inspection = soup.select_one('[data-id="7f5eaa88"]')
    if inspection:
        old_h1 = inspection.find("h1")
        if old_h1:
            old_h1.name = "h2"
            old_h1.string = "Know What This Flat Roof Needs Before You Spend"
        text = inspection.select_one('.elementor-widget-text-editor p')
        if text:
            text.string = (
                "A useful inspection separates active failures from aging conditions, checks for trapped moisture, "
                "and gives owners a defensible choice between repair, coating, recover, or replacement."
            )
        link = inspection.find("a")
        if link:
            link["href"] = "/contact?service=flat-roof-inspection"
            link.string = "Request a Flat Roof Inspection"

    spotlight = soup.select_one('[data-id="592bd219"]')
    if spotlight:
        headings = spotlight.find_all(["h2", "h4", "h5"])
        values = ["Fast Response", "ACTIVE ROOF LEAK? START HERE.", "Protect the building first. Then determine what failed and what the permanent repair requires."]
        for heading, value in zip(headings, values):
            heading.string = value
        link = spotlight.find("a")
        if link:
            link["href"] = "/contact?service=emergency-repair"
            link.string = "REQUEST EMERGENCY HELP"

    work = soup.select_one('[data-id="3f2acc4"]')
    if work:
        heading = work.find("h2")
        para = work.find("p")
        if heading:
            heading.string = "REPAIR THE LEAK. PROTECT THE OPERATION."
        if para:
            para.string = "Commercial roof repairs should control water, address the actual failure, and respect access, safety, production, tenants, and the next operating day."
        if not soup.select_one(".rr-sgf-decisions"):
            work.insert_after(fragment('''
<section class="rr-sgf-decisions">
  <div class="rr-sgf-decision-title"><p>Do not buy the wrong scope</p><h2>Repair, Restore, or Replace?</h2></div>
  <div class="rr-sgf-decision-grid">
    <a href="/services/commercial-roof-leak-repair"><span>Repair</span><h3>Fix isolated failures</h3><p>For serviceable roofs with contained damage, open seams, flashings, punctures, or drainage trouble.</p></a>
    <a href="/contact?service=roof-coating"><span>Restore</span><h3>Extend service life</h3><p>For compatible roofs that pass condition, moisture, adhesion, drainage, and detail review.</p></a>
    <a href="/contact?service=roof-replacement"><span>Replace</span><h3>Plan the next roof</h3><p>For widespread failure, trapped moisture, repeated repairs, or a system near the end of useful life.</p></a>
  </div>
</section>
'''))

    agreement = soup.select_one('[data-id="c051b46"]')
    if agreement:
        heading = agreement.find("h2")
        para = agreement.find("p")
        link = agreement.find("a")
        if heading:
            heading.string = "A ROOF SERVICE AGREEMENT KEEPS SMALL PROBLEMS SMALL"
        if para:
            para.string = (
                "Scheduled inspections, priority leak response, repair history, photo records, and budget updates "
                "give property and facility teams fewer surprises and a better plan for each roof."
            )
        if link:
            link["href"] = "/contact?service=service-agreement"
            link.string = "DISCUSS A SERVICE AGREEMENT"

    review = soup.select_one('[data-id="6ff32723"]')
    if review:
        heading = review.find("h2")
        if heading:
            heading.string = "A ROOF REPORT SHOULD HELP YOU MAKE A DECISION"

    close = soup.select_one('[data-id="7c3c081c"]')
    if close:
        heading = close.find("h2")
        para = close.find("p")
        link = close.find("a")
        if heading:
            heading.string = "TELL US WHAT IS HAPPENING ON THE ROOF"
        if para:
            para.string = "Active leak, aging membrane, storm concern, upcoming budget, or multiple buildings? Start with the property and the decision in front of you."
        if link:
            link["href"] = "/contact?service=not-sure"
            link.string = "GET COMMERCIAL ROOF HELP"


def rewrite_contact(soup: BeautifulSoup) -> None:
    if soup.body:
        soup.body["class"] = list(dict.fromkeys((soup.body.get("class") or []) + ["rr-sgf-contact"]))
    h1 = soup.find("h1")
    if h1:
        h1.string = "GET HELP WITH YOUR COMMERCIAL ROOF"


def add_assets_and_mobile_cta(soup: BeautifulSoup) -> None:
    for remote_font_sheet in list(soup.find_all("link", href="/assets-f/css/f91af93f686327.css")):
        remote_font_sheet.decompose()
    for google_font_sheet in list(soup.find_all("link", href=re.compile(r"^https://fonts\.googleapis\.com/"))):
        google_font_sheet.decompose()
    if soup.head and not soup.select_one("#rr-springfield-conversion-css"):
        link = soup.new_tag("link", rel="stylesheet", href="/springfield-conversion.css", id="rr-springfield-conversion-css")
        soup.head.append(link)
    if soup.head and not soup.select_one("#rr-springfield-conversion-js"):
        script = soup.new_tag("script", src="/springfield-conversion.js", id="rr-springfield-conversion-js", defer=True)
        soup.head.append(script)
    if soup.body and not soup.select_one(".rr-sgf-mobile-help"):
        soup.body.append(fragment(
            '<a class="rr-sgf-mobile-help" href="/contact?service=emergency-repair" aria-label="Request emergency commercial roof help">'
            '<span aria-hidden="true">!</span><strong>Emergency Roof Help</strong></a>'
        ))


def process(path: Path) -> None:
    soup = BeautifulSoup(path.read_text(errors="ignore"), "html.parser")
    remove_fake_phone(soup)
    if path.parent == PUBLIC and path.name in {"home.html", "index.html"}:
        rewrite_home(soup)
    if path.parent == PUBLIC and path.name == "contact.html":
        rewrite_contact(soup)
    restore_map(soup)
    add_assets_and_mobile_cta(soup)
    path.write_text(str(soup).replace("—", " - ").replace("–", "-"))


for html in PUBLIC.rglob("*.html"):
    if "assets-f" not in html.parts and not html.name.endswith(".ref"):
        process(html)

for text_path in [PUBLIC / "llms.txt", PUBLIC / "llms-full.txt"]:
    if text_path.exists():
        value = text_path.read_text(errors="ignore")
        text_path.write_text(value.replace(PHONE, "").replace(PHONE_TEL, "").replace("—", " - ").replace("–", "-"))

contact = BeautifulSoup((PUBLIC / "contact.html").read_text(), "html.parser")
assert "300 S Jefferson Ave, Suite 900, Springfield, MO 65806" in str(contact.select_one('script[data-rh-localbusiness="true"]'))
assert contact.select_one(f'iframe[src="{MAP_SRC}"]')
assert not any(PHONE in path.read_text(errors="ignore") for path in PUBLIC.rglob("*.html"))
print("springfield-conversion-pass: complete")
