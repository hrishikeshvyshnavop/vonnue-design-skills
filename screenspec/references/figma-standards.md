# Figma Build & Naming Standards

Rules for every design built by the `/screenspec` workflow (steps 5–6). They come from building the Watts footer: what made the file easy to read, resize and hand off, and what broke when it was skipped.

---

## 1. Structure

| Rule | Why |
|---|---|
| Every container is an **auto-layout** frame. Absolute positioning only for decoration that must overlap (badges, background shapes). | Content can change and the layout still holds. |
| No spacer frames. Use `itemSpacing` (gap) or padding. | Spacers are invisible layout bugs. |
| Children that should stretch use **Fill**; text that can grow uses **Hug** or Fill + auto height. Fixed sizes only for things that are truly fixed (icons, buttons, field height). | Lets one design work at many widths. |
| Rows that must reflow on small screens use **Wrap** with a row gap. | Columns stack instead of overflowing. |
| Keep the nesting shallow: one frame per real grouping (column, list, field). | Easier to select and read in Dev Mode. |
| Large graphics that scale (logos, wordmarks) get **locked aspect ratio** and a width, not a fixed height. | They shrink cleanly at each breakpoint. |

## 2. Responsiveness

- The section is **one component** whose root is resizable (fixed width, hug height).
- Show each breakpoint as an **instance** named `<Component> / <Breakpoint> <width>` (`Desktop` 1440, `Tablet` 768, `Mobile` 375), resized to that width. Never detach.
- **Default (no tokens):** the component holds the Desktop values. Tablet and Mobile instances get direct overrides for what changes: padding, gaps, column widths, font sizes, hidden layers.
- **With tokens (only if the user asked for them):** breakpoints are modes of a `<Project> / Layout` variable collection, everything that changes is bound to a variable, and each instance has its mode set explicitly.
- Check every breakpoint: no clipped text, no overflow, no overlaps.
- Instances can't override the width of a FIXED child inside auto layout (and can't override min/max width). When a column width must change per breakpoint (e.g. a table's label column), make the breakpoints **variants** of a component set (`Breakpoint=Desktop|Tablet|Mobile`) and keep the named instances.

## 3. Tokens (only when the user asks)

By default the workflow creates **no variables and no text styles**: fills, strokes, spacing and type are set directly on the layers. Create the tokens below only when the user asks for them; if a build would clearly benefit (for example a design-system handoff, or a file that already has this brand's tokens), ask first.

### Variables
Name pattern: `<type>/<group>/<role>` — lowercase, kebab-case words, slashes for groups.

| Type | Examples |
|---|---|
| `color` | `color/surface/page`, `color/surface/panel`, `color/surface/icon`, `color/text/primary`, `color/text/placeholder`, `color/brand/wordmark` |
| `space` | `space/panel/padding-top`, `space/panel/gap`, `space/columns/gap-x` |
| `size` | `size/column/nav`, `size/column/brand-min`, `size/logo/width` |
| `radius` | `radius/panel/start`, `radius/panel/end`, `radius/pill` |
| `type` | `type/title/size`, `type/title/line-height`: font sizes and line heights that change per breakpoint, bound to text styles |
| `visibility` | `visibility/globe`: BOOLEAN, bound to a layer's `visible` to show or hide it per breakpoint (booleans can't be scoped) |

- Name by **role**, never by value (`color/text/primary`, not `color/white`).
- Set **scopes** on every variable so it only appears in the right pickers (`TEXT_FILL`, `GAP`, `CORNER_RADIUS`, `WIDTH_HEIGHT`…).
- Collections: `<Project> / Color` (one mode) and `<Project> / Layout` (breakpoint modes). Never edit or rename collections that were already in the file.

### Text styles
Name pattern: `<Project>/<Role>` — e.g. `Watts/Tagline`, `Watts/Overline`, `Watts/Link`, `Watts/Caption`, `Watts/Button`, `Watts/Input`. Other roles in use: `Title`, `Description`, `Badge`, `Stat value`, `Stat label`, `Wordmark`, `Acknowledgement`.
When text styles are in use, every text layer uses one; no loose font settings.

## 4. Layer naming

### Casing
- **Frames and layers:** Sentence case: first word capitalized, the rest lowercase, words separated by spaces. `Email field`, `Link list`, `Stats row`. Proper names keep their capitals (`Logo/Watts`, `Icon/TikTok`). Same rule as the `figma-structure-refiner` skill, so either skill can run on the other's output without renaming.
- **Components and icons:** slash paths, each segment in Sentence case — `Footer`, `Icon/Instagram`, `Social link/Instagram`, `Logo/Watts`.
- **Variant properties:** `Property=Value` — `Breakpoint=Mobile`.

### Name by role, not content or look
| Instead of | Use |
|---|---|
| `Frame 12`, `Group 3` | what it is: `Columns`, `Newsletter` |
| `Fueling happier, healthier dogs…` (auto text name) | `Tagline` |
| `Orange box`, `Big text` | `Panel`, `Heading` |
| `Rectangle 4` behind a button | the button's fill, no extra layer |
| `Vector`, `Union` | `Icon/TikTok`, `Logo/Watts` |

### Standard role names
| Role | Name |
|---|---|
| Section root / component | the section: `Footer`, `Hero`, `Pricing`, `Stats` |
| Main coloured surface | `Panel` |
| Row of columns | `Columns` |
| A column | its job: `Brand`, `Navigation`, `Support`, `Newsletter`, `Contact`, `Address` |
| Vertical list of links | `Link list` → items `Link` |
| Column title | `Heading` (small caps label: still `Heading`) |
| Main statement | `Tagline` / `Title`; supporting text `Description`; fine print `Caption` |
| Text input | `<Purpose> field` → children `Placeholder` / `Value`, `Button` |
| Button | `Button` → child `Label`, optional `Icon/<Name>` |
| Icon-only link | `Social link/<Network>` → child `Icon/<Network>` |
| Row of items | `<Item> row` — `Social row`, `Wordmark row` |
| Grouping of a heading + its content | the purpose: `Signup`, `Follow` |
| Logo or wordmark | `Logo/<Brand>` |
| All content in a panel, apart from decoration | `Content` |
| Main text block plus its CTA | `Lead` → `Intro`, `Button` |
| Text that introduces a section (headline + description) | `Intro` |
| Small badge above a title, grouped with the title | `Headline` → `Badge`, `Title` |
| Small pill label above a title | `Badge` → child `Label` |
| One metric | `Stat` → children `Value`, `Label`; several sit in a `Stats row` |
| Decorative graphic placed absolutely | `<Name> [abs]`: `Globe [abs]` |
| Layers of a dot or halftone graphic, by strength | `Dots/<Strength>`: `Dots/Faint`, `Dots/Soft`, `Dots/Medium`, `Dots/Bright` |
| The vector inside an icon frame | its shape: `Chevron`, `Arrow`, `Pin` |
| Brand name set as live text (not an SVG logo) | `Wordmark`; one layer per word when the words are split apart, inside a `Wordmark row` |
| Lower block of a footer below a rule (statement, columns, bottom row) | `Details` |
| Acknowledgement of Country or similar statement | `Acknowledgement` → child `Description` |
| Postal address lines | `Address` → items `Address line` (not links; plain `Line` is a default Figma name and fails the audit) |
| Last row: copyright and logo | `Bottom row` → `Caption`, `Logo/<Brand>` |
| Data table | `Table` → `Header row`, then one `Feature group` per category (plain `Group` is a default Figma name and fails the audit) |
| Table header with one cell per plan or column | `Header row` → `Label cell` (empty corner), `Plan` → `Name`, `Price` |
| Category block inside a table | `Feature group` → `Group heading` (child `Heading`), then `Feature row`s |
| One table row | `Feature row` → `Label cell`, `Value cell` ×N |
| Table cell with a value | `Value cell` → `Value`, optional `Note` (second line), or `Icon/Check` |
| Label with a tooltip underline | `Tip` → child `Label` (dotted bottom stroke on `Tip`) |

_Catalog log (names converted to Sentence case on 2026-10-15; builds before that date still use Title Case in Figma): the Clarasight stats build (2026-10-05) added `Stats`, `Content`, `Lead`, `Intro`, `Headline`, `Badge`, `Stat`, `<Name> [abs]`, `Dots/<Strength>`, the icon vector rule, and the `type` and `visibility` token groups. The Set Space footer build (2026-10-05) added `Wordmark` (live text), `Details`, `Acknowledgement`, `Address` → `Address line`, `Bottom row`, the `Pin` icon vector, and the text-style roles `Wordmark` and `Acknowledgement`. The Deck compare-features build (2026-10-07) added `Table`, `Header row`, `Plan` → `Name`/`Price`, `Feature group` → `Group heading`, `Feature row`, `Label cell`, `Value cell` → `Value`/`Note`, `Tip` → `Label`, and the `Circle`/`Check` icon vectors._

### Repeated items
Repeated siblings share one role name (`Link`, `Link`, `Link`). Their text shows which is which. Add a suffix only when items differ in kind: `Social link/Instagram`.

### Breakpoint instances
`<Component> / <Breakpoint> <width>` — `Footer / Desktop 1440`, `Footer / Tablet 768`, `Footer / Mobile 375`.

## 5. Checks before calling it done

Run the audit script `scripts/figma_audit.js` (in the skill folder) with `use_figma`, with `__TOKENS__` set to `false` (default) or `true` (tokens were created). It fails on:
- default names: `Frame`, `Group`, `Rectangle`, `Ellipse`, `Vector`, `Text`, `Union`, `Line`, `Spacer`, or any name ending in a number like `Frame 12`
- text layers named after their own content
- text without a text style (only with tokens)
- fills or strokes not bound to a color variable (only with tokens)
- frames with children but no auto layout (unless marked `[abs]` in the name for intentional absolute layouts)
- names not in Sentence case (a later word in a segment starts with a capital, e.g. `Link List`); proper names like `Buy Me a Coffee` can be ignored when reported

Then take one screenshot per breakpoint.
