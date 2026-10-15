---
name: figma-structure-refiner
description: Refine an existing Figma Section, Frame, Component or Component Set (structure, layer naming, organization, spacing, constraints, component properties) without changing the design or content. Detects the selected object's type first and runs only that type's workflow. Use when the user asks to clean up, tidy, rename, restructure, organize or standardize Figma layers, frames, sections, screens, flows, components or variants, or to make a Figma file easier for AI tools (Claude, Codex) to read.
argument-hint: <figma url with node-id, or "current selection">
---

# Figma Structure & Naming Refiner

Refine Figma sections, frames and components based on the selected object type while preserving the existing design and content.

First determine whether the selected object is a **Section**, **Frame**, **Component** or **Component Set**, then apply only the matching workflow.

## How to run

1. Load the `figma:figma-use` skill before any `use_figma` call.
2. Get the target: the node in the user's Figma URL (`node-id=1-2` → `1:2`), or `figma.currentPage.selection` if they say "selection". If neither is clear, ask.
3. Read before writing: one read-only `use_figma` call that returns the node's `type`, its tree (names, types, auto layout, constraints, clipping, sizes, absolute positions) and, for components, variant and property definitions. Take one screenshot of the target as the visual baseline.
4. Pick the workflow from `type`: `SECTION` → Workflow 1, `FRAME` → Workflow 2, `COMPONENT` / `COMPONENT_SET` → Workflow 3. Anything else (group, instance, page): tell the user and ask which workflow they want.
5. Make the changes in small, retry-safe calls. Before each structural change, record each affected node's absolute bounds; after it, compare. Any change in position, size or visibility → revert that change.
6. Take a final screenshot, compare with the baseline, and send the workflow's completion report with real counts.

Don't create variables or text styles.

## Core rules

### Preserve the design

- Do not redesign the UI.
- Do not change existing text, copy, images, icons or content.
- Do not change colors, typography, dimensions or visual styling unless the selected workflow explicitly requires it.
- Do not modify the internal content of screens.
- Only modify structure, naming, organization, spacing, constraints and component properties where applicable.
- Preserve the existing visual hierarchy and intended layout.

### Visual integrity safeguard

All structural changes must be visually lossless. When renaming, removing, flattening, reorganizing or restructuring layers:

- Do not cause visual changes or layout shifts.
- Do not change element position or size.
- Do not change spacing or alignment.
- Do not change padding or dimensions unintentionally.
- Do not break auto layout behavior.
- Do not break constraints or resizing behavior.
- Do not change clipping or overflow behavior.
- Do not hide, resize, move or displace content.
- Do not introduce unexpected gaps or overlaps.
- Do not alter the visual appearance of the screen.

When removing a nested frame, first make sure its removal won't affect the visual result or functionality. If removing or restructuring a layer could cause any visual or functional break, keep the existing structure.

The final result should visually match the original design unless the selected workflow explicitly requires a change.

## Naming convention

- Use **Sentence case** for layer names.
- Names must be clear, descriptive and meaningful to AI tools such as Claude and Codex.
- Avoid generic names such as `Frame 123`, `Group 45` or `Rectangle 12` when the layer's purpose can be identified.
- Keep equivalent layers named the same across variants and states.
- Do not rename visible UI copy unless the layer name itself is being standardized.
- Name by purpose or role, not appearance.

| Bad | Good |
|---|---|
| `Frame 123`, `Group 45`, `Rectangle 12`, `Text 34` | `Header`, `Navigation`, `Content`, `Product card`, `Product image`, `Product title`, `Supporting text`, `Primary action`, `Footer` |

## Object type detection

Before making any changes:

1. Identify the selected object's Figma type: Section, Frame, Component or Component Set.
2. Apply only the workflow for that type.
   - Do not apply Section-specific changes to Frames.
   - Do not apply Component-specific changes to Sections or Frames.
3. Preserve all unrelated structure and content.

## Workflow 1: Section organization and flow cleanup

Run this when the selected object is a Section.

### Actions

- Rename the section and its relevant child layers in clear Sentence case.
- Use the existing cover as the primary entry point.
- Arrange sections in a logical sequence.
- Keep the cover and section headings on a consistent contextual theme.
- Standardize section background colors where required.
- Section titles use Sentence case, follow consecutive numbering, and visually align with the cover structure.
- Organize screens by user flow:
  - Happy-path screens come first.
  - Edge cases go directly below their happy-path screen.
  - Related states stay visually grouped with their flow.
  - Sub-flows go below the relevant main flow.
- Treat these as edge cases or alternate states and place them under the relevant happy path: error, empty, loading, validation, permission or access, no-results, success or confirmation, and other exceptional or alternate states.
- If desktop and mobile screens exist:
  - Same screen, desktop ↔ mobile: **50 px** gap.
  - Different screens: **200 px** gap.
- Adjust section-level padding and alignment where necessary.
- Do not modify the internal contents of the screens, and do not move or resize elements inside them. Move whole screens only.
- Preserve the visual appearance of every screen while reorganizing.

### Screen organization example

```
Screen 1 — Happy path
    Error state
    Empty state
    Loading state
    Validation state
    Other edge cases

Screen 2 — Happy path
    Error state
    Empty state
    Other edge cases

Screen 3 — Happy path
    Success state
    Confirmation state
```

The relationship between a happy-path screen and its states should be clear from both the spatial layout and the layer names.

### Section completion report

```
Section cleanup completed.

1. Sections renamed: X
2. Layers renamed: X
3. Screens reordered: X
4. Sections reorganized: X
5. Desktop/mobile pairs aligned: X
6. Nested structures removed: X
7. Auto layout / alignment cleaned up: X
8. Edge cases grouped under happy paths: X
```

## Workflow 2: Frame structure cleanup

Run this when the selected object is a Frame.

### Actions

- Rename all relevant layers in Sentence case, replacing unclear or generic names with descriptive ones.
- Identify unnecessary nested frames, and remove them only when that is visually and structurally safe.
- Keep frames that provide meaningful layout, auto layout, constraints, padding, alignment, component structure or clipping.
- Fix auto layout only when required for structural consistency.
- Correct padding and spacing only where the existing structure is clearly inconsistent.
- Fix alignment and constraints where necessary.
- Do not alter the frame's internal content or visual design, and do not rewrite or modify any visible text.
- Keep the hierarchy as simple as possible without breaking functionality.
- If a structural change introduces a visual or functional risk, undo it and keep the original structure.

### Visual verification

After the cleanup, verify:

- Element positions and dimensions are unchanged.
- Spacing and alignment are unchanged.
- Padding is unchanged unless intentionally corrected.
- Auto layout and constraints behave correctly.
- Content stays visible, with no new clipping, gaps or overlaps.
- The frame visually matches the original design.

Structural cleanup never takes priority over visual fidelity.

### Frame completion report

```
Frame cleanup completed.

1. Nested frames removed: X
2. Layers renamed: X
3. Auto Layout fixes: X
4. Padding fixes: X
5. Alignment fixes: X
6. Unnecessary layers removed: X
7. Visual changes introduced: 0
8. Visual integrity verified: Yes
```

## Workflow 3: Component refactoring and standardization

Run this when the selected object is a Component or Component Set.

### Actions

- Rename all component layers in Sentence case, and use the same names across all variants.
- Find and fix inconsistent variant naming; rename variant properties where required.
- Add missing component properties when they are clear and necessary.
- Standardize equivalent properties across variants; variant values use consistent Sentence case.
- Preserve the component's appearance and behavior:
  - Don't change its dimensions unless explicitly required.
  - Don't change visual styling or visible content.
  - Don't remove layers the component's behavior needs.
  - Keep auto layout, constraints, interactions and resizing behavior.
- Apply changes consistently across all relevant variants, without introducing visual differences between them that the design doesn't already have.
- If a structural refactor could break a variant, keep the existing structure.

### Component consistency checks

Verify:

- Layer names, variant property names and variant value patterns are consistent across variants.
- Component properties are meaningful and clear.
- Auto layout and constraints still work.
- Component dimensions are stable.
- Visual appearance, interactions and behavior are preserved.

### Component completion report

```
Component refactoring completed.

1. Components renamed: X
2. Layers renamed: X
3. Variants standardized: X
4. Variant properties updated: X
5. Component properties added: X
6. Inconsistent structures fixed: X
7. Visual changes introduced: 0
8. Component behavior preserved: Yes
```

## Final validation

Before finishing, confirm:

- The correct object-type workflow was used.
- Names follow Sentence case.
- Generic layer names were replaced wherever their purpose is identifiable.
- Unnecessary structural complexity was reduced where safe.
- No visible content was modified.
- No unintended visual changes occurred.
- No auto layout or constraint behavior was broken.
- No content was moved, resized, hidden, clipped or displaced unintentionally.
- For Sections: desktop/mobile spacing follows the 50 px / 200 px rule, and edge cases sit directly under their happy-path screens.

If any structural change caused a visual or functional issue, revert it. Visual fidelity comes before structural simplification.

The result is a Figma file that is cleaner, easier for AI tools such as Claude and Codex to understand, and structurally consistent, with the same visual design and behavior.
