# ScreenSpec Template

Turns one screenshot into a structured, Refero-style description.
File naming: `screenspecs/screenspec-<NN>-<site-slug>.md`

Rules (from `refero-context-findings.md`):
- Tags (Page Types, UX Patterns, UI Elements) use the Refero names listed below.
- Colors: exactly 5 hex values, sampled from the image when it is available as a file.
- Description = looks (colors, fonts, sizes). Layout = arrangement (no colors). Functions = user actions and goal (no colors or px).
- Mark estimated sizes with "~". Quote visible button and label text with 'single quotes'.
- Leave out anything a screenshot can't show (Refero IDs, flows), or mark it `unknown`.

Precision rules (from the spec-only rebuild test, so a spec alone can rebuild the design):
- Quote multi-line text with its line breaks marked ` / `, e.g. 'Fueling happier, healthier dogs. / One Watt at a time!'.
- Give the size and position of large blocks as % of the section width, e.g. "wordmark spans x 37–95%, ~32px above the bottom edge".
- Say which color goes on each element, and give a hex for every color mentioned, not only the 5 in Colors.
- State what must not wrap and how elements touch, e.g. "links stay on one line", "button fills the field's full height and covers its right edge".
- Write "Hover: unknown (not visible in screenshot)" instead of leaving hover out or inventing it.
- Fonts: real family names if the site was checked, with the free stand-in in brackets, e.g. `Degular (paid; stand-in: Familjen Grotesk)`.

---

## Screen: <short-name>

- **Platform**: web | ios | android
- **Page URL**: <if known, else unknown>
- **Source Image**: <file path of the screenshot>
- **Page Types**: <e.g. Product Page & Landing, Home Page, Pricing, Sign Up, Log In, Contacts, Careers, About, Dashboard, Settings, Checkout, Paywall & Subscription, Integration Page>
- **UX Patterns**: <e.g. Testimonials, FAQ, Empty State, Onboarding, Searching, Filtering, Booking, Video Player, Pricing Plans, Product Features, Templates, User Menu>
- **UI Elements**: <e.g. Navigation Bar, Footer, Button, Cards & Tiles, Accordion & Collapse, Tabs, Table, Text Field, Dropdown, Search Field, Modal, Badge, Icon, Logo Wall, Photo, Product Image>
- **Fonts**: <best guess, e.g. Inter (estimated)>
- **Colors**: 0xRRGGBB, 0xRRGGBB, 0xRRGGBB, 0xRRGGBB, 0xRRGGBB

### Content
- **Description**: <~250–400 words. Opening: "This is a <theme> <page type> for a <product category>." Then, in order: background and theme → accent colors (hex) → typography (sizes and weights, ~) → nav bar → hero and CTAs → sections → cards → footer → hover and effects → closing: "Overall, the style is …">
- **Layout**: <~150–250 words. Opening: "The layout is …" (single-column, two-column, sidebar, modal). Then from top to bottom: header → hero → sections and grids → footer → spacing and max width. End with: "Keywords: …, …, …">
- **Functions**: <~150–200 words. Opening: "Users can …". List the actions and quote CTA labels. End with: "Overall, the interface supports <business goal>.">

### Site
- **Name**: <brand>
- **Domain**: <domain or unknown>
- **Categories**: <e.g. Productivity, Fintech, AI, Video Streaming>
