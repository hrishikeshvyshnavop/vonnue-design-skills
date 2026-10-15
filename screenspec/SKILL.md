---
name: screenspec
description: Turn a website screenshot (full page or one section) into a Refero-style ScreenSpec md, optionally blind-test the spec by rebuilding it from text alone (the user decides), then build it natively in Figma or as a local HTML page (always asks which, and where), with the real (or closest free) fonts. Uses subagents for the blind build, site research, spec review and Figma audit. Use whenever the user uploads, pastes or links an image or screenshot of a website or UI, even with no other instructions, and when they ask for a ScreenSpec, a spec-only rebuild, or a Figma version.
argument-hint: <screenshot path> [figma url] [site domain]
---

# ScreenSpec workflow

Screenshot in → structured spec → proof the spec works → editable, responsive Figma design.

Path placeholders used below:
- `<skill>` = this skill's base directory (shown when the skill loads). Reference files and scripts live there.
- `<project>` = the current working directory. Outputs go to `<project>/screenspecs/` (create it if missing).
- `<scratchpad>` = the session scratchpad directory, or a temp folder if there is none.

Always expand them to absolute paths before running a command or writing an agent prompt.

## Requirements

| Needed for | What |
|---|---|
| Step 1 | Python 3 with Pillow (`pip install pillow`) |
| Step 4 | Chrome, Edge or Chromium (or `BROWSER=<path>`) |
| Agent [B] | `curl` |
| Steps 5–6 | The Figma plugin for Claude Code (Figma MCP), logged in, with edit access to the target file |

If something is missing, tell the user which step it blocks and run the steps that still work.

| File | Role |
|---|---|
| `<skill>/references/screenspec-template.md` | The spec format and writing rules. Read it before step 2. |
| `<skill>/references/refero-context-findings.md` | Why the format looks the way it does (analysis of 20 Refero screens). |
| `<skill>/references/examples/screen-NN-*.md` | Real Refero examples (20, from `refero_get_screen`) to match in tone and length. |
| `<skill>/references/figma-standards.md` | Figma build, responsiveness, token and layer-naming rules for steps 5–6. |
| `<project>/screenspecs/screenspec-NN-<slug>.md` | Output spec. |
| `<project>/screenspecs/screenspec-NN-<slug>-specOnly.html` | Output of the blind test. |

`NN` = next free number among existing `<project>/screenspecs/screenspec-*.md` files (01 if none). `<slug>` = brand name, kebab-case.

## Inputs

- **Screenshot** (required): a file path, an image pasted or uploaded in chat (its path appears as `[Image: source: …]`), or an image URL (download it to `<scratchpad>` with curl first). An uploaded image on its own is enough to start the workflow.
- **Output target** (always ask): at the start of every run, before step 1, ask where the result goes, even if a default file is known: **Figma** (which file, and which page/node), **local HTML** (`<project>/screenspecs/screenspec-NN-<slug>.html`), or **spec only**. Skip the ask only when this request already names the target. Suggest the last-used Figma file as the first option.
- **Figma URL**: needed for steps 5–6 when the target is Figma. Never create a new Figma file unless the user asks; if they want one, ask which team.
- **Site domain** (optional): needed for agent [B]. If missing, try to infer it from the screenshot (logo, copyright line) and confirm with a quick fetch.
- **Blind test** (optional, the user decides): steps [A] and [C] run only when the user asks for them. If the request doesn't say, ask once after writing the spec ("Run the blind test? It rebuilds the section from the spec alone and reviews the gaps.") and launch [B] in the background while waiting for the answer. On "no", skip [A] and [C] and go from [B] straight to the Figma build.

Ask only for what blocks the next step. Everything else has a default below.

## Agent plan

Steps 1–2 and the Figma build stay in the main session: the spec writer needs the screenshot, and Figma build calls depend on each other's node ids. Four jobs go to subagents, so nobody grades their own work and noisy research stays out of the main context.

```
main: 1 Measure → 2 Write spec → ask: blind test? (skip the ask if the request already said)
        ├─► [A] Blind Builder    ┐  only if the user said yes;
        └─► [B] Asset Researcher ┘  launch together, run_in_background
main: wait, render A's HTML                    (blind test only)
        └─► [C] Spec Reviewer                  (blind test only)
main: apply C's fixes (if any) + B's fonts/colors to the spec → 5 Figma build
        └─► [D] Figma Auditor
main: apply D's fixes → 7 Report
```

Rules for every agent:
- Always a **fresh `general-purpose` agent**, never a fork. A fork inherits the screenshot and this conversation, which breaks the blind test and the independent reviews.
- Give each one **absolute paths** and everything it needs in the prompt; it knows nothing else.
- **Agents report, the main session decides and edits.** Only [A] writes a project file (its HTML). [B] writes only to the scratchpad. [C] and [D] change nothing.
- Ask for a short, structured reply (tables or lists), not a narrative.
- If an agent fails or its report is unclear, say so to the user; never fill in its results yourself.

## Steps

### 1. Measure the image (main)
Run the bundled script on the screenshot:

```
python "<skill>/scripts/sample_colors.py" "<image path>"
```

(Needs Pillow: `pip install pillow` if the import fails.)

- Take the **5 Colors** from the top results: the main surfaces first, then text, then accents. Drop near-duplicates.
- Note the image width. If it is ~2× a common viewport (2880 → 1440), it is a retina capture: **CSS px = image px ÷ 2**. All sizes in the spec are CSS px.
- Measure positions of large blocks (columns, logo, cards) as **% of the section width**.

### 2. Write the spec (main)
Fill `<skill>/references/screenspec-template.md` and save as `<project>/screenspecs/screenspec-NN-<slug>.md`. Follow every rule in the template, especially the precision rules (line breaks, % positions, color per element, no-wrap, how elements touch, unknown hover). Skim one or two `<skill>/references/examples/` files first to match their tone and length.

If only one section of a page was given, add `- **Section**: <Footer | Hero | …>` under Source Image and describe only that section.

### 3. [A] Blind Builder (optional) + [B] Asset Researcher (parallel)

**[A] Blind Builder** proves the spec is enough on its own. Run it only if the user chose the blind test (see Inputs). Prompt:

> You are running a blind test: can a written design spec alone reproduce a website section?
> Read ONLY `<project>/screenspecs/screenspec-NN-<slug>.md`. Do not open, read or list any other file (in particular not the image under "Source Image"), and do not search the web.
> Build one self-contained HTML file at `<project>/screenspecs/screenspec-NN-<slug>-specOnly.html`: spec colors as CSS custom properties on `:root`, free Google Fonts as stand-ins, the hover states the spec mentions, no horizontal scroll at phone width. Do not open it in a browser.
> Reply with: 1) the output path, 2) every place the spec was ambiguous or missing information and what you assumed (value, choice, reason). That list is the main result, so be thorough.

**[B] Asset Researcher** finds what the live site really uses. Skip it if no domain is known. Prompt:

> Find the real fonts, colors and logo used on https://<domain>, for its <section> section. Use curl with a browser user agent (`curl -sL -A "Mozilla/5.0"`) and save files only under `<scratchpad>`.
> 1. In the HTML and its main CSS, find `@font-face`, `font-family` and type tokens (`--t-…`, `--font-…`). Report each family, its weights and its role (headings, body, labels, brand).
> 2. For each family: free (Google Fonts / open licence) or paid? Name the foundry if you can.
> 3. For each paid family, list 3–5 free Google Fonts alternatives with a similar shape, closest first, one line on why.
> 4. Report the `:root` color tokens (name → hex).
> 5. If the section's logo or wordmark is an inline `<svg>`, save its full markup to `<scratchpad>/logo.svg` and report the viewBox.
> Do not edit any project file. Reply with tables for fonts, alternatives and colors, plus the logo path.

When both return:
- Put the real font names into the spec's Fonts line, e.g. `Degular (paid; stand-in: Familjen Grotesk)`, and correct any Colors the site tokens contradict.
- Font rule: **free real font → use it**; **paid → choose from B's alternatives** with the specimen test in step 5; **no site → mark "(estimated)"** and still do the specimen test.

### 4. [C] Spec Reviewer (optional, with [A])
Skip this step when the blind test was skipped. First render [A]'s HTML in the main session, so the reviewer gets an image. Use the CSS viewport width from step 1:

```
python "<skill>/scripts/render.py" "<project>/screenspecs/screenspec-NN-<slug>-specOnly.html" "<scratchpad>/specOnly.png" 1440 1100
```

It finds Edge, Chrome or Chromium on Windows, macOS or Linux and exits with an error if nothing was written. View the PNG once yourself before handing it to [C], to catch a blank or broken render.

Prompt:

> You are reviewing whether a design spec is precise enough. Compare the original screenshot `<image path>` with a rebuild made only from the spec, rendered at `<scratchpad>/specOnly.png`. Read the spec `<project>/screenspecs/screenspec-NN-<slug>.md` and the builder's assumptions below.
> For each visible difference (position, size, wrapping, line breaks, color, font, shape, spacing), find the sentence in the spec that caused it, or the information that is missing. Ignore differences that come only from using a stand-in font.
> Do not edit any file. Reply with a table: Problem | Cause in spec | Suggested spec wording. Then list any rule that would apply to every screen (template candidates).
> Builder's assumptions: <paste A's list>

The main session then edits the spec with the suggested wording. General rules belong in the shared template: list them for the user and add them to `<skill>/references/screenspec-template.md` once the user agrees. Rerun [A] only if the user asks; one round usually closes the big gaps.

### 5b. HTML build (main, when the target is HTML; replaces 5–6)
Write one self-contained `<project>/screenspecs/screenspec-NN-<slug>.html` from the spec, using the screenshot as reference: `:root` color properties, semantic HTML, flex/grid, inline SVG logo/icons, real free fonts or B's closest free alternative, hovers from the spec, responsive at 1440/768/375 with no horizontal scroll. Render it with `scripts/render.py` at those three widths, compare with the screenshot, fix, and stop when it passes. Keep it local; never publish it.

### 5. Figma build (main)
Load the `figma:figma-use` skill first, and follow `<skill>/references/figma-standards.md` for structure, responsiveness, tokens and layer names. Then:
1. Inspect the file read-only: pages, the target node, existing variable collections, text styles, available fonts. Never overwrite or rename existing content. Build inside the node the user linked (e.g. an empty Section); if it isn't empty, place the new work beside what's there.
   Font style names differ between families (`SemiBold` vs `Semi Bold`), so take them from `listAvailableFontsAsync()`, never guess.
2. If a font is paid, set the section's real text in each of [B]'s alternatives that exist in Figma (`figma.listAvailableFontsAsync()`) as a temporary specimen, compare with the screenshot (width, x-height, letter shapes), pick one, delete the specimen.
3. **No variables or text styles by default.** Set fills, strokes, spacing, radii and type directly on the layers. Create tokens only if the user asked for them; if the build would clearly benefit (a design-system handoff, or the file already has this brand's tokens), ask first. With tokens, follow §3 of figma-standards.md: `<Brand> / Color` and `<Brand> / Layout` (modes `Desktop` 1440, `Tablet` 768, `Mobile` 375) collections, and `<Brand>/<Role>` text styles.
4. Build the section as **one component**, all auto layout, no spacers: root (fixed width, hug height) → `Panel` → rows/columns (Wrap where they must stack) → text layers → `Icon/<Name>` and `Logo/<Brand>` as SVG vectors (use [B]'s `logo.svg` when available; locked aspect ratio).
5. Desktop values come from the spec's % positions and px sizes. Tablet and Mobile: same structure, columns wrap, text unclipped.
6. Create three instances named `<Component> / <Breakpoint> <width>`, each resized to its width. Without tokens, override what changes per breakpoint directly on the Tablet and Mobile instances (padding, gaps, column widths, font sizes, hidden layers). With tokens, set each instance's Layout mode explicitly instead.
7. Read back each instance's height. If a shape depends on it (e.g. a semicircle end = half the panel height), update that value for the breakpoint; text often changes heights by a few px.
8. Delete anything temporary (specimens, an older version of the build) only after the new build is confirmed.
9. **Update the naming catalog.** Compare every layer name (and, when tokens were made, every variable group and text-style role) in the build with the catalog in `<skill>/references/figma-standards.md` (§3 Tokens and §4 Standard role names). Add each name that isn't there yet, with a one-line role and an example from this build (e.g. `Stat` → children `Value`, `Label`). Don't add one-off names that only make sense for this brand. List the additions in the report.

Build in two or three retry-safe calls (component + instances → fixes; tokens first only when asked), and return every created id. If a script fails, check what it left on the canvas before retrying.

### 6. [D] Figma Auditor
Prompt:

> You are auditing a Figma component against a written standard. Do not change anything in the file: read-only scripts and screenshots only.
> File key `<fileKey>`, component `<componentId>`, instances: Desktop `<id>`, Tablet `<id>`, Mobile `<id>`. Load the `figma:figma-use` skill before any `use_figma` call.
> 1. Read `<skill>/scripts/figma_audit.js`, replace `__ROOT_ID__` with the component id and `__TOKENS__` with `<true if variables/text styles were created, else false>`, and pass the whole script as the `code` of one `use_figma` call (it can't load files itself). Report every problem it returns.
> 2. Read `<skill>/references/figma-standards.md` and check what the script can't: role-based names, nesting depth, breakpoint instance names, and (only if tokens were created) variable names, scopes and text styles.
> 3. Screenshot each instance once. Report clipped or overlapping text, overflow, and anything that breaks at Tablet or Mobile.
> 4. Compare the Desktop screenshot with the original `<image path>` and list visible differences.
> Reply with one table: Node (name + id) | Problem | Suggested fix. Say "no problems" for any check that passes.

The main session applies the fixes, then takes **one** screenshot per breakpoint that changed. Stop when they pass.

### 7. Report (main)
Short summary for the user:
- Paths of the files written, and the Figma link with the node id.
- What came from measurement versus estimation (fonts, sizes, hover states).
- The reviewer table from step 4 (if the blind test ran) and the auditor result from step 6.
- **New naming-catalog entries** from step 5.9, as a short list (name → role), or "no new names".
- Open questions only when the user's answer would change the result.

## Workflow version

`<skill>/workflows/screenspec.js` runs the same pipeline hands-off as a saved workflow, with one extra step: **[R] Refero references** pulls 2–3 similar screens with the Refero MCP (`refero_search_screens` → `refero_get_screen`) so the spec reuses Refero's tag names and wording. It can't ask questions mid-run, so ask before launching: the output target (Figma file/node, HTML, or spec only; required, the workflow refuses to start without it) and the blind test (`blindTest`, default off). Use it when the user asks for the workflow or a hands-off run; pass `{image, output: "figma"|"html"|"spec", figmaFileKey (for figma), figmaNodeId?, domain?, blindTest?}`.

## Partial runs

Each step works alone; skip the agents a request doesn't need.

| Request | Run |
|---|---|
| Spec only | 1–2 (+ [B] if a domain is known; ask about the blind test) |
| Full run, no blind test | 1–2 → [B] → 5 → [D] → 7 |
| Test a spec | [A] → render → [C] |
| Figma only, from an existing spec | [B] if fonts unknown → 5 → [D] |
| Audit an existing Figma build | [D] |

## Rules

- Keep outputs as md files. Don't paste the full spec into chat or export chat logs.
- Never publish a rebuild of a real brand as a shareable page; keep HTML local. Building it in the user's own Figma file is fine.
- Be honest about what was seen: if a build used the screenshot, say so; the blind test must not.
- Use `0xRRGGBB` in the Colors line and `#RRGGBB` in the Description.
