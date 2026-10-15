export const meta = {
  name: 'screenspec',
  description: 'Screenshot → Refero-style ScreenSpec → optional blind test → responsive Figma component, audited',
  whenToUse: 'Run on a website/UI screenshot. ASK the user first where to build (Figma file/node, local HTML, or spec only). args: {image, output: "figma"|"html"|"spec", figmaFileKey (if figma), figmaNodeId?, domain?, blindTest?, refero?, scratchpad?}',
  phases: [
    { title: 'Measure', detail: 'sample colors, size, brand, section, next NN' },
    { title: 'Research', detail: 'Refero similar screens + live-site fonts/colors/logo' },
    { title: 'Spec', detail: 'write screenspec-NN-<slug>.md' },
    { title: 'Blind test', detail: 'spec-only rebuild + reviewer (only if blindTest)' },
    { title: 'Finalize spec', detail: 'apply reviewer fixes and real fonts/colors' },
    { title: 'Figma build', detail: 'one component + Desktop/Tablet/Mobile instances (output: figma)' },
    { title: 'HTML build', detail: 'local responsive HTML page (output: html)' },
    { title: 'Audit', detail: 'read-only audit, then fixes' },
  ],
}

// ---------- inputs ----------
const A = typeof args === 'string' ? { image: args } : (args || {})
if (!A.image) throw new Error('args.image (screenshot path) is required')

const PROJECT = A.project || 'C:/Users/Vonnue/.claude/skills/screenspec'  // outputs land in the repo clone (junction)
const SKILL = A.skillDir || 'C:/Users/Vonnue/.claude/skills/screenspec'
const SCRATCH = A.scratchpad || 'C:/Users/Vonnue/AppData/Local/Temp/screenspec'
const FILE_KEY = A.figmaFileKey
const TARGET = A.figmaNodeId
  ? `inside node ${A.figmaNodeId} (if it isn't empty, place the new work beside what's there)`
  : 'on the Playground page, in a new Section placed below the latest section'
const BLIND = A.blindTest === true
const USE_REFERO = A.refero !== false
// Where the result is built. No default on purpose: the caller must ask the user first.
const OUTPUT = A.output
if (!['figma', 'html', 'spec'].includes(OUTPUT)) {
  throw new Error('args.output is required: ask the user whether to build in Figma (which file/node), as local HTML, or spec only, then pass "figma" | "html" | "spec"')
}
if (OUTPUT === 'figma' && !A.figmaFileKey) {
  throw new Error('output "figma" needs args.figmaFileKey (and optionally figmaNodeId): ask the user where to draw it')
}

// Every agent sees the project CLAUDE.md, which auto-runs the skill on images.
const ROLE = 'You are one step of the screenspec workflow, run by an orchestrator. Do NOT invoke the screenspec skill or start the whole workflow; do only the step below.'

// ---------- schemas ----------
const MEASURE = {
  type: 'object',
  properties: {
    nn: { type: 'string', description: 'two-digit next free number' },
    slug: { type: 'string' },
    brand: { type: 'string' },
    domain: { type: 'string', description: 'domain or "unknown"' },
    section: { type: 'string', description: 'Full page, Hero, Footer, …' },
    imageWidth: { type: 'number' },
    imageHeight: { type: 'number' },
    cssScale: { type: 'number', description: '2 for retina, else 1' },
    cssViewportWidth: { type: 'number' },
    colors: { type: 'array', items: { type: 'string' }, description: '5 colors as 0xRRGGBB, surfaces → text → accents' },
    blockPositions: { type: 'string', description: 'large blocks as % of section width' },
    pageTypes: { type: 'string', description: 'best guess, Refero names' },
  },
  required: ['nn', 'slug', 'brand', 'domain', 'section', 'imageWidth', 'cssScale', 'cssViewportWidth', 'colors'],
}
const REFERO = {
  type: 'object',
  properties: {
    available: { type: 'boolean', description: 'false if no Refero MCP tools were found' },
    files: { type: 'array', items: { type: 'string' }, description: 'saved refero_get_screen markdown paths' },
    tags: { type: 'string', description: 'Page Types / UX Patterns / UI Elements names Refero uses for these screens' },
    notes: { type: 'string', description: 'patterns in how Refero words similar sections' },
  },
  required: ['available', 'files', 'tags'],
}
const ASSETS = {
  type: 'object',
  properties: {
    fonts: { type: 'array', items: { type: 'object', properties: {
      family: { type: 'string' }, weights: { type: 'string' }, role: { type: 'string' },
      free: { type: 'boolean' }, foundry: { type: 'string' },
      alternatives: { type: 'array', items: { type: 'string' }, description: 'free Google Fonts, closest first' },
    }, required: ['family', 'role', 'free'] } },
    colors: { type: 'array', items: { type: 'object', properties: { token: { type: 'string' }, hex: { type: 'string' } }, required: ['hex'] } },
    logoSvg: { type: 'string', description: 'path or "none"' },
    logoViewBox: { type: 'string' },
    problems: { type: 'string' },
  },
  required: ['fonts', 'colors', 'logoSvg'],
}
const BLIND_OUT = {
  type: 'object',
  properties: {
    htmlPath: { type: 'string' },
    assumptions: { type: 'array', items: { type: 'object', properties: {
      gap: { type: 'string' }, assumed: { type: 'string' }, reason: { type: 'string' },
    }, required: ['gap', 'assumed'] } },
  },
  required: ['htmlPath', 'assumptions'],
}
const REVIEW = {
  type: 'object',
  properties: {
    renderOk: { type: 'boolean' },
    rows: { type: 'array', items: { type: 'object', properties: {
      problem: { type: 'string' }, cause: { type: 'string' }, wording: { type: 'string' },
    }, required: ['problem', 'cause', 'wording'] } },
    templateCandidates: { type: 'array', items: { type: 'string' } },
  },
  required: ['renderOk', 'rows', 'templateCandidates'],
}
const BUILD = {
  type: 'object',
  properties: {
    sectionId: { type: 'string' },
    componentId: { type: 'string' },
    desktopId: { type: 'string' },
    tabletId: { type: 'string' },
    mobileId: { type: 'string' },
    fontsUsed: { type: 'string', description: 'family per role and why (specimen result)' },
    catalogAdditions: { type: 'array', items: { type: 'string' }, description: 'name → role, added to figma-standards.md' },
    notes: { type: 'string' },
  },
  required: ['componentId', 'desktopId', 'tabletId', 'mobileId', 'catalogAdditions'],
}
const AUDIT = {
  type: 'object',
  properties: {
    rows: { type: 'array', items: { type: 'object', properties: {
      node: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
    }, required: ['node', 'problem', 'fix'] } },
    passed: { type: 'array', items: { type: 'string' } },
  },
  required: ['rows'],
}

// ---------- 1. Measure ----------
phase('Measure')
const m = await agent(`${ROLE}
Step 1, measure a screenshot: ${A.image}
1. Run: python "${SKILL}/scripts/sample_colors.py" "${A.image}"  (pip install pillow if the import fails). Pick 5 colors: main surfaces first, then text, then accents; drop near-duplicates. Format 0xRRGGBB.
2. Read the image. Note its pixel size. If the width is ~2× a common viewport (2880 → 1440), cssScale = 2 and CSS px = image px ÷ 2.
3. Measure large blocks (columns, logo, cards) as % of the section width.
4. Identify brand, section (Full page, Hero, Footer, …) and domain${A.domain ? ` (the user says: ${A.domain})` : ' (infer from logo/copyright; confirm with a quick curl -sIL; else "unknown")'}.
5. NN = next free two-digit number among ${PROJECT}/screenspecs/screenspec-*.md (01 if none). slug = brand in kebab-case.
Change no files.`, { label: 'measure', schema: MEASURE, effort: 'low' })
if (!m) throw new Error('Measure step failed')

const SPEC = `${PROJECT}/screenspecs/screenspec-${m.nn}-${m.slug}.md`
const HTML = `${PROJECT}/screenspecs/screenspec-${m.nn}-${m.slug}-specOnly.html`
const DOMAIN = A.domain || (m.domain && m.domain !== 'unknown' ? m.domain : null)
log(`${m.brand} · ${m.section} · ${m.cssViewportWidth}px CSS → ${SPEC}`)

// ---------- 2–3. Research (B) in parallel with Refero → Spec ----------
phase('Research')
const assetsP = DOMAIN
  ? agent(`${ROLE}
Step [B] Asset Researcher. Find the real fonts, colors and logo used on https://${DOMAIN}, for its ${m.section} section. Use curl with a browser user agent (curl -sL -A "Mozilla/5.0") and save files only under ${SCRATCH}/${m.slug}/ (create it).
1. In the HTML and its main CSS, find @font-face, font-family and type tokens (--t-…, --font-…). Report each family, weights and role (headings, body, labels, brand).
2. For each family: free (Google Fonts / open licence) or paid? Foundry if known.
3. For each paid family, 3–5 free Google Fonts alternatives with a similar shape, closest first.
4. Report the :root color tokens (name → hex).
5. If the section's logo/wordmark is an inline <svg>, save its full markup to ${SCRATCH}/${m.slug}/logo.svg and report the viewBox; else logoSvg = "none".
Do not edit any project file.`, { label: '[B] assets', phase: 'Research', schema: ASSETS })
  : Promise.resolve(null)
if (!DOMAIN) log('No domain known: skipping [B]; fonts will be marked (estimated)')

const specP = (async () => {
  let ref = null
  if (USE_REFERO) {
    ref = await agent(`${ROLE}
Step [R] Refero references. First check that the Refero MCP is connected: run ToolSearch with "+refero search". If it returns no refero_* tools, or the first Refero call fails with an auth/connection error, stop and return available=false, files=[], tags="" — do not substitute other sources.
Otherwise use the Refero tools. Find 2–3 web screens on Refero most similar to this one: a ${m.section} section of ${m.brand}${DOMAIN ? ` (${DOMAIN})` : ''}, page type ~${m.pageTypes || 'unknown'}. First try refero_search_sites/refero_search_screens for the brand itself; otherwise search by section type and style. You may look at the screenshot ${A.image} to judge similarity.
For each pick, call refero_get_screen and save its full text to ${SCRATCH}/${m.slug}/refero-NN.md (create the folder). Then report the exact Page Types / UX Patterns / UI Elements names Refero used, and a few notes on how Refero words this kind of section.
Change no project files.`, { label: '[R] refero', phase: 'Research', schema: REFERO })
    if (!ref) log('Refero step failed; spec will use bundled examples only')
    else if (!ref.available) { log('Refero MCP not connected (run /mcp to connect); spec will use bundled examples only'); ref = null }
    else log(`Refero: ${ref.files.length} similar screen(s) saved`)
  }

  await agent(`${ROLE}
Step 2, write the ScreenSpec. Screenshot: ${A.image}
Read ${SKILL}/references/screenspec-template.md and follow every rule (precision rules: line breaks with " / ", % positions, a hex per element, no-wrap, how elements touch, "Hover: unknown (not visible in screenshot)"). Skim one or two of ${SKILL}/references/examples/screen-*.md for tone and length${ref && ref.files.length ? `, plus these similar Refero screens: ${ref.files.join(', ')}` : ''}.
${ref ? `Prefer these Refero tag names where they fit: ${ref.tags}\nWording notes: ${ref.notes || '-'}` : ''}
Measurements (CSS px = image px ÷ ${m.cssScale}; all spec sizes in CSS px):
- Colors (use these exactly in the Colors line): ${m.colors.join(', ')}
- Image ${m.imageWidth}×${m.imageHeight || '?'} px, CSS viewport ${m.cssViewportWidth}
- Blocks: ${m.blockPositions || 'measure from the image'}
- Brand ${m.brand}, domain ${DOMAIN || 'unknown'}, section ${m.section}
${/full/i.test(m.section) ? '' : `Add "- **Section**: ${m.section}" under Source Image and describe only that section.`}
Fonts: estimate for now and mark "(estimated)"; the live-site check comes later.
Use 0xRRGGBB in the Colors line and #RRGGBB in the Description.
Write the file to ${SPEC} (create the folder if missing). Write nothing else. Return only the path.`, { label: 'write spec', phase: 'Spec' })
  return ref
})()

const [assets, ref] = await Promise.all([assetsP, specP])
if (DOMAIN && !assets) log('[B] failed; fonts stay (estimated)')

// ---------- 3–4. Blind test (optional) ----------
let review = null, blind = null
if (BLIND) {
  phase('Blind test')
  blind = await agent(`You are running a blind test: can a written design spec alone reproduce a website section?
Read ONLY ${SPEC}. Do not open, read or list any other file (in particular not the image under "Source Image"), do not search the web, and do not invoke any skill.
Build one self-contained HTML file at ${HTML}: spec colors as CSS custom properties on :root, free Google Fonts as stand-ins, the hover states the spec mentions, no horizontal scroll at phone width. Do not open it in a browser.
Return the output path and every place the spec was ambiguous or missing information and what you assumed (value, choice, reason). That list is the main result, so be thorough.`, { label: '[A] blind build', schema: BLIND_OUT })

  if (blind) {
    review = await agent(`${ROLE}
Step [C] Spec Reviewer.
1. Render the blind rebuild: python "${SKILL}/scripts/render.py" "${blind.htmlPath}" "${SCRATCH}/${m.slug}/specOnly.png" ${m.cssViewportWidth} 1100
   View the PNG. If it is blank or broken, set renderOk=false and stop.
2. Compare the original screenshot ${A.image} with the rebuild. Read the spec ${SPEC} and the builder's assumptions below.
For each visible difference (position, size, wrapping, line breaks, color, font, shape, spacing), find the spec sentence that caused it or the missing information. Ignore differences that come only from stand-in fonts.
Do not edit any file. Also list rules that would apply to every screen (template candidates).
Builder's assumptions: ${JSON.stringify(blind.assumptions)}`, { label: '[C] review', schema: REVIEW })
    if (review && !review.renderOk) log('Render was blank/broken; reviewer table is unreliable')
  } else log('[A] failed; skipping review')
}

// ---------- Finalize spec ----------
phase('Finalize spec')
if (assets || (review && review.rows.length)) {
  await agent(`${ROLE}
Edit the spec ${SPEC} in place (Edit tool, no other files).
${assets ? `Live-site findings from ${DOMAIN}: ${JSON.stringify({ fonts: assets.fonts, colors: assets.colors })}
- Put real font names in the Fonts line, e.g. "Degular (paid; stand-in: Familjen Grotesk)": free real font → use it; paid → name its first alternative as provisional stand-in (the Figma step confirms it with a specimen test).
- Correct any Colors or Description hex values the site tokens clearly contradict (keep exactly 5 in Colors).` : ''}
${review && review.rows.length ? `Apply the reviewer's suggested wording where it fixes the spec: ${JSON.stringify(review.rows)}` : ''}
Return a 3–6 line list of what changed.`, { label: 'apply fixes', effort: 'low' })
} else log('Nothing to apply to the spec')

if (OUTPUT === 'spec') {
  return { spec: SPEC, blindHtml: blind && blind.htmlPath, refero: ref, assets, review, output: 'spec only' }
}

// ---------- 5b. HTML build (instead of Figma) ----------
if (OUTPUT === 'html') {
  const OUT_HTML = `${PROJECT}/screenspecs/screenspec-${m.nn}-${m.slug}.html`
  phase('HTML build')
  const html = await agent(`${ROLE}
Build the spec as a local HTML page (never publish it anywhere).
Spec: ${SPEC}. Original screenshot (use it as the visual reference): ${A.image}.
${assets ? `Live-site fonts: ${JSON.stringify(assets.fonts)}. Logo SVG: ${assets.logoSvg}. Font rule: free real font → load it from Google Fonts; paid → use its closest free alternative.` : 'Fonts are estimated; use free Google Fonts.'}
Write one self-contained file at ${OUT_HTML}: colors as CSS custom properties on :root, semantic HTML, flex/grid (no absolute positioning for layout), inline SVG for the logo/icons, the hover states the spec mentions, responsive at 1440 / 768 / 375 with no horizontal scroll and no clipped text.
Then render it: python "${SKILL}/scripts/render.py" "${OUT_HTML}" "${SCRATCH}/${m.slug}/html-1440.png" ${m.cssViewportWidth} 1100, view it next to the screenshot, and fix visible differences (one or two rounds).
Return the path and a short list of what remains different.`, { label: 'html build' })

  phase('Audit')
  const htmlAudit = await agent(`${ROLE}
Audit a local HTML build without editing it. File: ${OUT_HTML}. Original screenshot: ${A.image}.
Render it at three widths with python "${SKILL}/scripts/render.py" "${OUT_HTML}" "${SCRATCH}/${m.slug}/audit-<w>.png" <w> 1100 for w = ${m.cssViewportWidth}, 768, 375. View each.
Report clipped or overlapping text, horizontal overflow, broken stacking at 768/375, and visible differences from the screenshot at desktop width.`, { label: 'html audit', schema: AUDIT })

  let htmlFixes = null
  if (htmlAudit && htmlAudit.rows.length) {
    htmlFixes = await agent(`${ROLE}
Apply these fixes to ${OUT_HTML} (edit only that file), then re-render the widths that changed with "${SKILL}/scripts/render.py" and confirm.
Fixes: ${JSON.stringify(htmlAudit.rows)}
Return: fixed / skipped (why).`, { label: 'apply html fixes', effort: 'low' })
  }
  return { spec: SPEC, blindHtml: blind && blind.htmlPath, html: OUT_HTML, htmlBuild: html, refero: ref, assets, review, audit: htmlAudit, fixes: htmlFixes }
}

// ---------- 5. Figma build ----------
phase('Figma build')
const build = await agent(`${ROLE}
Step 5, build the spec natively in Figma. Load the figma:figma-use skill before any use_figma call, and follow ${SKILL}/references/figma-standards.md.
Spec: ${SPEC}. Original screenshot (for visual reference): ${A.image}. File key ${FILE_KEY}; build ${TARGET}.
${assets ? `Live-site fonts: ${JSON.stringify(assets.fonts)}. Logo SVG: ${assets.logoSvg}${assets.logoViewBox ? ` (viewBox ${assets.logoViewBox})` : ''}.` : 'Fonts are estimated.'}
1. Inspect read-only first: pages, target, existing content, available fonts (listAvailableFontsAsync; take style names from it, never guess). Never overwrite or rename existing content.
2. Paid font: set the section's real text in each available free alternative as a temporary specimen, compare with the screenshot (width, x-height, letter shapes), pick one, delete the specimens. Free real font: use it.
3. No variables and no text styles: set fills, strokes, spacing, radii and type directly.
4. One component, all auto layout, no spacers: root (fixed width, hug height) → Panel → rows/columns (Wrap where they stack) → text → Icon/<Name> and Logo/<Brand> as SVG vectors (locked aspect ratio; use the logo SVG if given; for a complex raster decoration, detect it with PIL, write an SVG and import with upload_assets).
5. Desktop values from the spec's % positions and px sizes. Create three instances "<Component> / Desktop 1440", "/ Tablet 768", "/ Mobile 375", resized; override per breakpoint directly on Tablet and Mobile (padding, gaps, column widths, font sizes, hidden layers). Text never clipped.
6. Read back each instance height; fix shapes that depend on it.
7. Update the naming catalog in ${SKILL}/references/figma-standards.md (§4 Standard role names): add each layer name from this build not yet there, one-line role + example; skip brand one-offs.
Build in two or three retry-safe calls; if a call fails, check what it left on the canvas before retrying. Return every created id.`, { label: 'figma build', schema: BUILD })
if (!build) throw new Error('Figma build failed; check the canvas for partial work')

// ---------- 6. Audit → fixes ----------
phase('Audit')
const audit = await agent(`${ROLE}
Step [D] Figma Auditor. Change nothing in the file: read-only scripts and screenshots only. Load the figma:figma-use skill before any use_figma call.
File key ${FILE_KEY}, component ${build.componentId}, instances: Desktop ${build.desktopId}, Tablet ${build.tabletId}, Mobile ${build.mobileId}.
1. Read ${SKILL}/scripts/figma_audit.js, replace __ROOT_ID__ with ${build.componentId} and __TOKENS__ with false, and pass the whole script as the code of one use_figma call. Report every problem it returns.
2. Read ${SKILL}/references/figma-standards.md and check what the script can't: role-based names, nesting depth, breakpoint instance names.
3. Screenshot each instance once. Report clipped or overlapping text, overflow, anything that breaks at Tablet or Mobile.
4. Compare the Desktop screenshot with the original ${A.image} and list visible differences.
List passing checks under "passed".`, { label: '[D] audit', schema: AUDIT })

let fixes = null
if (audit && audit.rows.length) {
  fixes = await agent(`${ROLE}
Apply these Figma audit fixes in file ${FILE_KEY} (load figma:figma-use first). Component ${build.componentId}; instances Desktop ${build.desktopId}, Tablet ${build.tabletId}, Mobile ${build.mobileId}. No variables or text styles; don't touch nodes outside this build.
Fixes: ${JSON.stringify(audit.rows)}
Afterwards take ONE screenshot per breakpoint that changed and confirm it passes. If any new layer names were introduced, add them to the naming catalog in ${SKILL}/references/figma-standards.md. Return a short list: fixed / skipped (why) / new catalog names.`, { label: 'apply audit fixes' })
} else if (!audit) log('[D] failed; build is unaudited')

return {
  spec: SPEC,
  blindHtml: blind && blind.htmlPath,
  figma: `https://www.figma.com/design/${FILE_KEY}/?node-id=${build.componentId.replace(':', '-')}`,
  build,
  refero: ref,
  assets,
  review,
  audit,
  fixes,
}
