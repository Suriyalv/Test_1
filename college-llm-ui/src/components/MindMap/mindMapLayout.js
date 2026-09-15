// Tidy two-sided mind map layout.
//
// The central topic sits at the middle. Top-level branches are dealt to the left
// and right halves, and every deeper level steps further out from the centre.
// Vertical placement is the classic tidy-tree rule: a leaf takes the next free
// row, and a parent centres itself on its first and last child.
//
// Everything here is pure geometry — it returns plain numbers, so the view can
// render the same layout as absolutely positioned cards plus one SVG of curves.

const GAP_X = 82; // horizontal breathing room between two levels
const ROW_GAP = 18; // vertical gap between two stacked leaves
const PAD = 60; // padding around the whole drawing

/** Card width for a given depth: the deeper the node, the more compact. */
export const nodeWidth = (depth) => (depth === 0 ? 230 : depth === 1 ? 204 : 176);

/** Font size the view paints the label at, mirrored here so heights line up. */
export const nodeFontSize = (depth) => (depth === 0 ? 16 : depth === 1 ? 14 : 12.8);

const nodePadY = (depth) => (depth === 0 ? 15 : depth === 1 ? 12 : 10);

/**
 * Estimate how tall a card will be once its label wraps.
 * Tamil glyphs are wider than Latin ones, so they get a larger advance width.
 */
const nodeHeight = (node, depth, isTa) => {
  const width = nodeWidth(depth);
  const fontSize = nodeFontSize(depth);
  const advance = fontSize * (isTa ? 0.62 : 0.55);
  const iconRoom = node.icon ? 22 : 0;
  const charsPerLine = Math.max(6, Math.floor((width - 26 - iconRoom) / advance));
  const label = node.label || "";
  const lines = Math.max(1, Math.ceil(label.length / charsPerLine));

  let height = nodePadY(depth) * 2 + lines * Math.round(fontSize * 1.35);
  if (node.formula) height += 20; // the formula chip under the label
  return height;
};

/** Horizontal offset of each column, measured from the centre of the root. */
const columnOffsets = (maxDepth) => {
  const offsets = [0];
  offsets[1] = nodeWidth(0) / 2 + GAP_X;
  for (let depth = 2; depth <= maxDepth + 1; depth += 1) {
    offsets[depth] = offsets[depth - 1] + nodeWidth(depth - 1) + GAP_X;
  }
  return offsets;
};

/** Deal the top-level branches into a left and a right column. */
const splitSides = (branches) => {
  const left = [];
  const right = [];
  branches.forEach((branch, index) => {
    // A branch can pin itself to a side in the data; otherwise they alternate.
    if (branch.side === "left") left.push(branch);
    else if (branch.side === "right") right.push(branch);
    else (index % 2 === 0 ? left : right).push(branch);
  });
  return { left, right };
};

/**
 * Build the drawing for one map.
 *
 * @param {object} root       the presented root node (with nested children)
 * @param {Set}    collapsed  ids whose children are currently hidden
 * @param {boolean} isTa      Tamil mode, which widens the text estimate
 * @returns {{nodes: Array, links: Array, width: number, height: number, rootPoint: object}}
 */
export function layoutMindMap(root, collapsed, isTa = false) {
  if (!root) {
    return { nodes: [], links: [], width: 0, height: 0, rootPoint: { x: 0, y: 0 } };
  }

  const visibleChildren = (node) =>
    collapsed.has(node.id) ? [] : node.children || [];

  // How deep the visible tree goes, so the column table covers every level.
  const deepest = (node, depth) =>
    visibleChildren(node).reduce(
      (best, child) => Math.max(best, deepest(child, depth + 1)),
      depth
    );
  const offsets = columnOffsets(deepest(root, 0));

  const placed = [];

  /** Walk one side, stacking leaves and centring parents on their children. */
  const placeSide = (branches, side) => {
    let cursor = 0;

    const place = (node, depth, parent, branchId) => {
      const children = visibleChildren(node);
      const width = nodeWidth(depth);
      const height = nodeHeight(node, depth, isTa);

      let y;
      if (!children.length) {
        y = cursor + height / 2;
        cursor += height + ROW_GAP;
      } else {
        const laid = children.map((child) => place(child, depth + 1, node, branchId));
        y = (laid[0].y + laid[laid.length - 1].y) / 2;
      }

      const x = side === "right" ? offsets[depth] : -offsets[depth] - width;
      const entry = {
        id: node.id,
        node,
        depth,
        side,
        branchId,
        parentId: parent ? parent.id : null,
        hasChildren: (node.children || []).length > 0,
        collapsed: collapsed.has(node.id),
        x,
        y,
        w: width,
        h: height,
      };
      placed.push(entry);
      return entry;
    };

    branches.forEach((branch) => place(branch, 1, root, branch.id));

    // Centre this side's block of branches on the root's own line.
    const total = Math.max(0, cursor - ROW_GAP);
    const shift = -total / 2;
    return shift;
  };

  const { left, right } = splitSides(root.children || []);

  const rightStart = placed.length;
  const rightShift = placeSide(right, "right");
  for (let i = rightStart; i < placed.length; i += 1) placed[i].y += rightShift;

  const leftStart = placed.length;
  const leftShift = placeSide(left, "left");
  for (let i = leftStart; i < placed.length; i += 1) placed[i].y += leftShift;

  // The root last, so it can sit on the centre line both sides were built around.
  const rootWidth = nodeWidth(0);
  const rootHeight = nodeHeight(root, 0, isTa);
  const rootEntry = {
    id: root.id,
    node: root,
    depth: 0,
    side: "center",
    branchId: null,
    parentId: null,
    hasChildren: (root.children || []).length > 0,
    collapsed: collapsed.has(root.id),
    x: -rootWidth / 2,
    y: 0,
    w: rootWidth,
    h: rootHeight,
  };
  placed.push(rootEntry);

  // Shift everything into positive space so it can be laid out in a plain div.
  const minX = Math.min(...placed.map((p) => p.x)) - PAD;
  const maxX = Math.max(...placed.map((p) => p.x + p.w)) + PAD;
  const minY = Math.min(...placed.map((p) => p.y - p.h / 2)) - PAD;
  const maxY = Math.max(...placed.map((p) => p.y + p.h / 2)) + PAD;

  const nodes = placed.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // One cubic curve per parent → child, leaving and arriving horizontally so the
  // whole drawing reads as branches growing outward from the centre.
  const links = [];
  nodes.forEach((child) => {
    if (!child.parentId) return;
    const parent = byId.get(child.parentId);
    if (!parent) return;

    const outward = child.side === "right";
    const x1 = outward ? parent.x + parent.w : parent.x;
    const x2 = outward ? child.x : child.x + child.w;
    const y1 = parent.y;
    const y2 = child.y;
    const bend = (x2 - x1) * 0.5;

    links.push({
      id: `${parent.id}->${child.id}`,
      accent: child.node.accent,
      depth: child.depth,
      d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
    });
  });

  return {
    nodes,
    links,
    width: maxX - minX,
    height: maxY - minY,
    rootPoint: { x: rootEntry.x - minX + rootWidth / 2, y: rootEntry.y - minY },
  };
}

/** Ids of every node that has children, i.e. everything that can be collapsed. */
export function collectParentIds(node, ids = []) {
  if (!node) return ids;
  if ((node.children || []).length) {
    ids.push(node.id);
    node.children.forEach((child) => collectParentIds(child, ids));
  }
  return ids;
}

/** All the text a node carries, lower-cased, for the search box to match on. */
const searchableText = (node) =>
  [node.label, node.summary, node.formula, ...(node.points || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/**
 * Find nodes matching a query and return both the matches and every ancestor
 * that has to be open for those matches to be on screen.
 */
export function searchMindMap(root, query) {
  const needle = query.trim().toLowerCase();
  const matches = new Set();
  const ancestors = new Set();
  if (!needle || !root) return { matches, ancestors };

  const walk = (node, trail) => {
    if (searchableText(node).includes(needle)) {
      matches.add(node.id);
      trail.forEach((id) => ancestors.add(id));
    }
    (node.children || []).forEach((child) => walk(child, [...trail, node.id]));
  };

  walk(root, []);
  return { matches, ancestors };
}
