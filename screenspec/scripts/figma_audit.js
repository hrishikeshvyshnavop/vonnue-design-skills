// Figma audit for figma-standards.md. Paste into use_figma as the code body.
// Set ROOT_ID to the component or frame to check. Returns a list of problems.
// Set TOKENS to true only when the build uses variables and text styles (the user asked for them).
const ROOT_ID = '__ROOT_ID__';
const TOKENS = __TOKENS__;

const root = await figma.getNodeByIdAsync(ROOT_ID);
let pg = root; while (pg.type !== 'PAGE') pg = pg.parent;
await figma.setCurrentPageAsync(pg);

const DEFAULT = /^(Frame|Group|Rectangle|Ellipse|Vector|Text|Union|Subtract|Line|Polygon|Star|Spacer)( \d+)?$/i;
const NUMBERED = / \d+$/;
const problems = [];
const add = (n, issue) => problems.push({ id: n.id, name: n.name, issue });

const nodes = [root, ...root.findAll(() => true)];
for (const n of nodes) {
  // Vectors inside icons/logos are allowed generic names
  const inGraphic = n.parent && /^(Icon|Logo)\//.test(n.parent.name);
  if (!inGraphic && (DEFAULT.test(n.name) || NUMBERED.test(n.name))) add(n, 'default or numbered name');

  if (n.type === 'TEXT') {
    if (n.name === n.characters || (n.characters.length > 12 && n.characters.startsWith(n.name)))
      add(n, 'text layer named after its content');
    if (TOKENS && !n.textStyleId) add(n, 'no text style');
  }

  for (const key of (TOKENS ? ['fills', 'strokes'] : [])) {
    if (!(key in n) || n[key] === figma.mixed) continue;
    for (const p of n[key]) {
      if (p.type === 'SOLID' && p.visible !== false && !(p.boundVariables && p.boundVariables.color))
        add(n, `${key} not bound to a color variable`);
    }
  }

  if ((n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'INSTANCE') &&
      n.children && n.children.length > 0 && n.layoutMode === 'NONE' &&
      !/^(Icon|Logo)\//.test(n.name) && !n.name.includes('[abs]'))
    add(n, 'frame with children but no auto layout');
}
return { checked: nodes.length, problems };
