# Refero Screen Context — Findings

Based on the 20 screens saved in `examples/` as `screen-01-*.md` … `screen-20-*.md` (fetched with `refero_get_screen`).

## 1. Overall template

```
## Screen: <uuid>

- Platform          always "web" here
- Page URL          live page
- Preview URL       full screenshot (…_preview.jpg)
- Thumbnail URL     small screenshot (…_thumb.jpg)
- ReferoURL         refero.design/pages/<uuid>
- Page Types        optional
- UX Patterns       optional
- UI Elements       always
- Fonts             optional
- Colors            optional, always exactly 5 when present

### Content
- Description       visual style
- Layout            structure, top to bottom
- Functions         what users can do

### Flows           rare: only when the screen is part of a recorded flow
- <Flow name> (Step N of M, Flow ID: …)

### Site
- ID, Name, ReferoURL (refero.design/websites/<id>), Domain, Categories, Description (tagline)
```

### How often each field appears (out of 20)

| Field | Present | Missing in |
|---|---|---|
| Platform, URLs, UI Elements, Content (3 parts), Site | 20/20 | — |
| Fonts | 19 | Teenage Engineering |
| Colors | 18 | Teenage Engineering, Mailchimp |
| Page Types | 17 | Orchids, Scape, SoundCloud |
| UX Patterns | 14 | Ballpark, Mailchimp, Cartesia, Loom, Buy Me a Coffee, DocuSign |
| Flows | 1 | only Scape ("Booking tour", step 3 of 12) |

### Tags vs. written text
- **Tags** (Page Types, UX Patterns, UI Elements) come from fixed lists, so you can filter and compare screens by them. "Product Page & Landing" appears in 10 of the 17 screens that have a page type.
- **Colors** are always 5 values written as `0xRRGGBB`, likely a palette measured from the screenshot.
- **Fonts** are real font names, but the list is sometimes messy, with empty entries like `Helvetica Neue, ` and `, Cera Pro`.
- **Site** information is the same for every screen from the same website.

## 2. The `### Content` section in detail

| Field | Words | Sentences | Hex colors | px values | Focus |
|---|---|---|---|---|---|
| Description | ~135–470 | 5–20 (usually 13–19) | 1–17 per screen (106 total) | 0–4 | How it **looks** |
| Layout | ~60–260 | 3–14 (usually 8–12) | **0** in all 20 | 0–2 | How it is **arranged** |
| Functions | ~125–220 | 5–10 | **0** in all 20 | **0** in all 20 | What users **do** and why |

Each field has its own job: visual details such as color and size are only in Description, and Functions never mentions colors or pixel sizes.

### Description: how it looks
- **Opening:** names the page type and the product category, such as "This is a dark-mode landing page…" or "The screen is a clean, minimalistic signup interface…".
- **Order:** theme and background color → accent colors → typography (sizes and weights) → nav bar → hero and buttons → sections → cards → footer → hover effects → overall style.
- **Closing:** a one-line summary of the style, often starting with "Overall…" or "The overall style is clean, modern, professional…".
- **Hex colors:** there are 106 hex values across the descriptions, and **none of them match the screen's own `Colors` list**. They are the AI's guesses (for example, Vimeo `#00BFFF` vs. the measured `#17B8D9`), so use `Colors` for real values.
- **Hedging words** such as "around", "approx.", "likely" and "~" appear 0–6 times per description, so sizes and colors are estimates.
- **Several screenshots:** 13 of 20 say "the screenshots" or "the provided screens", so the AI was given multiple images, probably slices of a long page.
- **Brand name:** 11 of 20 name the brand, and the rest say things like "an AI audio platform".
- **Notes about animation:** 4 of 20 add remarks like "no visible animations in the static screenshot".
- **On-screen text:** button and label text is often quoted (101 quotes in total), for example 'Learn more' and 'Request a demo'.

### Layout: how it is arranged
- **Opening:** nearly always starts with "The layout is/uses…" followed by the main structure: single-column, two-column, sidebar, or modal.
- **Order:** header → hero → sections → grids and cards → footer, then overall spacing and grid rules.
- **No colors at all**, and px values are rare (only max width or padding).
- **Keyword lists:** 7 of 20 end with lines like "Keywords include: two-column grid, horizontal nav bar, …", which look like leftover search tags from the generation prompt. They are useful for search.
- **Closing:** usually a summary such as "modular, grid-based, easy to scan".

### Functions: what users can do
- **Opening:** 20 of 20 start with "Users can…" or "Users visiting this interface can…".
- **Content:** lists user actions (browse, click CTAs, fill forms, watch videos, expand accordions) and quotes the CTA labels (48 quotes in total).
- **Closing:** 13 of 20 end with "Overall…", "At a broader level…" or "Combined…", naming the business goal, such as conversion, sign-up, trust, or a demo request.
- **No visual details**, so this field works as a UX and task description.

## 3. How to use it
- **Real colors:** use the `Colors` field, not the hex values in Description.
- **Filtering and grouping:** use the Page Types, UX Patterns and UI Elements tags.
- **Searching by structure:** use Layout, especially the "Keywords" lines.
- **Rebuilding a design:** combine Description (style), Layout (structure) and the Preview URL (ground truth), and treat all px and hex values in the text as estimates.
