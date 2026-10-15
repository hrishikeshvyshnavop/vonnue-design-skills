# screenspec

A Claude Code skill and workflow for the Vonnue design team. It turns a website screenshot into three things:

1. **A ScreenSpec**: a structured, Refero-style description of the screen (tags, 5 measured colors, how it looks, how it's laid out, what users can do).
2. **A blind test of that spec** (optional, you choose): a separate agent rebuilds the design from the text alone, and a reviewer agent lists exactly where the spec was too vague.
3. **A Figma component or a local HTML page** (it always asks which, and where in Figma). The Figma build is a responsive component: auto layout, Desktop/Tablet/Mobile instances, real fonts (or the closest free match) and the site's real logo, checked by an audit agent.

## Install

This skill lives in the `screenspec/` folder of [design-knowledge-base](https://github.com/hrishikeshvyshnavop/design-knowledge-base). Clone the repo, then link the folder into your Claude folders so edits are live everywhere (Windows, no admin needed):

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\screenspec" -Target "<repo>\screenspec"
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\workflows" -Target "<repo>\screenspec\workflows"
```

On macOS/Linux: `ln -s <repo>/screenspec ~/.claude/skills/screenspec` and `ln -s <repo>/screenspec/workflows/screenspec.js ~/.claude/workflows/`. Restart Claude Code if `/screenspec` doesn't appear.

### Requirements

| For | You need |
|---|---|
| Color sampling | Python 3 + Pillow (`pip install pillow`) |
| Rendering the blind test | Chrome, Edge or Chromium |
| Reading the live site | `curl` |
| Similar-screen references | The Refero MCP, connected (`/mcp`) |
| Figma build and audit | The Figma plugin for Claude Code, logged in, with edit access to the target file |

Anything missing only blocks its own step; the rest still runs.

## Use

Two ways to run it:

| | How | Best for |
|---|---|---|
| **Skill** | `/screenspec <screenshot> [figma url] [domain]`, or paste a screenshot | Interactive runs: it asks where to build, then about the blind test and you can steer between steps |
| **Workflow** | "run the screenspec workflow on <screenshot>" | Hands-off runs: every step is a fresh agent in a fixed order; watch progress in `/workflows` |

Workflow args (`workflows/screenspec.js`):

| Arg | Default |
|---|---|
| `image` | required: screenshot path |
| `domain` | inferred from the screenshot |
| `blindTest` | `false` |
| `refero` | `true`: pulls 2–3 similar Refero screens to match tags and wording |
| `output` | required, no default: `figma`, `html` or `spec`. Claude asks you before launching |
| `figmaFileKey` / `figmaNodeId` | required for `figma`; asked each run (suggests `D2YSLONP8r5J69GiH8YBwK`, Playground page) |
| `project` / `scratchpad` | the installed skill folder (so outputs land in `screenspecs/` here) / a temp folder |

| You want | Say |
|---|---|
| The full run | `/screenspec shot.png https://figma.com/design/... example.com` |
| Full run, no blind test | "screenspec of this and build it in Figma, skip the blind test" |
| Only a spec | "screenspec of this, spec only" |
| Test an existing spec | "blind-test screenspecs/screenspec-03-acme.md" |
| Figma from an existing spec | "build screenspec-03 in Figma: <link>" |
| Audit a Figma build | "audit the Footer component in <link>" |

Outputs go to `screenspecs/`:
- `screenspec-NN-<brand>.md`: the spec
- `screenspec-NN-<brand>.html`: the HTML build (when you pick HTML)
- `screenspec-NN-<brand>-specOnly.html`: the blind rebuild (only when the blind test runs)

The skill never creates Figma files on its own and never renames what's already in the file.

## How it works

```
1 Measure image ─┬─► [B] Asset Researcher  (real fonts, colors, logo from the live site)
                 └─► [R] Refero references → 2 Write spec
[A] Blind Builder → [C] Spec Reviewer        (optional; spec only, never sees the image)
Finalize spec (B's fonts/colors + C's fixes)
5 Figma build → naming catalog → [D] Figma Auditor → fixes   (output: figma)
5b HTML build → render at 1440/768/375 → audit → fixes      (output: html)
report
```

Agents only report; edits happen in one place per step. Full instructions: `SKILL.md`.

## What's inside

```
README.md                        this file
SKILL.md                         the skill (interactive workflow)
workflows/screenspec.js          the same pipeline as a multi-agent workflow
references/
  screenspec-template.md         spec format + precision rules
  figma-standards.md             Figma structure, responsiveness, tokens and the layer-naming catalog
  refero-context-findings.md     analysis of Refero's format
  examples/                      20 real Refero screen specs + the source list
scripts/
  sample_colors.py               dominant colors as 0xRRGGBB
  render.py                      headless screenshot of an HTML file (Win/macOS/Linux)
  figma_audit.js                 use_figma audit against figma-standards.md
screenspecs/                     outputs (Watts, Clarasight, Set Space, Deck)
CLAUDE.md                        project rules (auto-run on screenshots, no Figma variables)
```

## Contributing

Edit the template and standards directly. When a run's reviewer suggests a rule that applies to every screen, add it to `references/screenspec-template.md`. New layer names from each Figma build are added to the naming catalog in `references/figma-standards.md` and listed in the run's report. Commit the changes so teammates get them.

## Rules the skill follows

- Rebuilds of real brands stay local (HTML) or in your own Figma file; they're never published as shareable pages.
- Paid fonts aren't downloaded; the closest free font is chosen by a side-by-side specimen test.
- It says what was measured and what was estimated.
