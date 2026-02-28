'use client';

import { useMemo, useRef, useEffect, useState, createContext, useContext, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  BaseEdge,
  Handle,
  Position,
  type Node,
  type NodeProps,
  type EdgeProps,
  type ReactFlowInstance,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import {
  CompositionDiamond,
  AggregationDiamond,
  GeneralizationArrow,
  DirectedAssociationArrow,
  diamondBase,
  arrowBase,
  DEFAULT_DIAMOND_LENGTH,
  DEFAULT_ARROW_LENGTH,
} from '../components/UmlRelationshipMarkers';

const FIT_VIEW_OPTS = { padding: 0.2, maxZoom: 0.9, duration: 300 };

// ─── Generated diagram API types (from backend) ───────────────────
interface ApiUmlAttribute {
  name: string;
  type: string;
  visibility: '+' | '-' | '#' | '~';
  description?: string;
}
interface ApiUmlMethod {
  name: string;
  params: string;
  returnType: string;
  visibility: '+' | '-' | '#' | '~';
  description?: string;
}
interface ApiUmlClass {
  id: string;
  className: string;
  explanation?: string;
  stereotype?: string;
  abstract?: boolean;
  isInterface?: boolean;
  isEnum?: boolean;
  enumValues?: string[];
  attributes: ApiUmlAttribute[];
  methods: ApiUmlMethod[];
}
interface ApiUmlRelationship {
  source: string;
  target: string;
  relationship: 'composition' | 'aggregation' | 'association' | 'directed_association' | 'generalization' | 'dependency';
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
}

// ─── UML class node data ─────────────────────────────────────────
interface UMLAttribute {
  name: string;
  type: string;
  visibility: '+' | '-' | '#' | '~';
}
interface UMLMethod {
  name: string;
  params: string;
  returnType: string;
  visibility: '+' | '-' | '#' | '~';
}
interface UMLClassData {
  className: string;
  explanation?: string;
  stereotype?: string;
  abstract?: boolean;
  isInterface?: boolean;
  isEnum?: boolean;
  enumValues?: string[];
  attributes: (UMLAttribute & { description?: string })[];
  methods: (UMLMethod & { description?: string })[];
}

function formatStereotype(s: string) {
  return `<<${s}>>`;
}

const UmlDetailsContext = createContext<boolean>(false);

// ─── UML Class node (3 compartments) ──────────────────────────────
function UMLClassNodeInner({ data, selected }: NodeProps) {
  const d = data as unknown as UMLClassData;
  const hideDetails = useContext(UmlDetailsContext);
  const visColor = (v: string) => (v === '+' ? '#6ee7b7' : v === '-' ? '#f87171' : v === '#' ? '#fbbf24' : '#94a3b8');

  const hiddenHandle = { opacity: 0, pointerEvents: 'none' as const, width: 1, height: 1 };
  return (
    <>
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <div
        style={{
          position: 'relative',
          minWidth: 200,
          maxWidth: 280,
          background: '#1a1a1e',
          border: selected ? '1px solid rgba(var(--color-primary-rgb), 0.5)' : '1px solid #333',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: selected ? '0 0 25px rgba(var(--color-primary-rgb), 0.3)' : '0 4px 20px rgba(0,0,0,0.35)',
          transform: selected ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'all 0.3s ease',
          fontFamily: 'ui-monospace, monospace',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            background: 'linear-gradient(180deg, #252528 0%, #1e1e22 100%)',
            borderBottom: '1px solid #333',
            textAlign: 'center',
          }}
        >
          {d.stereotype && (
            <div style={{ fontSize: 10, color: '#888', marginBottom: 2, fontStyle: 'italic' }}>
              {formatStereotype(d.stereotype)}
            </div>
          )}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '0.02em',
              fontStyle: d.abstract ? 'italic' : undefined,
            }}
          >
            {d.className}
          </div>
        </div>
        {d.attributes.length > 0 && (
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid #2a2a2e',
              background: '#1e1e22',
            }}
          >
            {d.attributes.map((a, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color: '#b4b4b8',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: i < d.attributes.length - 1 ? 4 : 0,
                }}
              >
                <span style={{ color: visColor(a.visibility), fontWeight: 600, minWidth: 12 }}>{a.visibility}</span>
                <span style={{ color: '#e4e4e7' }}>{a.name}</span>
                {!hideDetails && <span style={{ color: '#71717a' }}>: {a.type}</span>}
              </div>
            ))}
          </div>
        )}
        {d.isEnum && d.enumValues && d.enumValues.length > 0 ? (
          <div style={{ padding: '8px 14px', background: '#1a1a1e' }}>
            {d.enumValues.map((val, i) => (
              <div key={i} style={{ fontSize: 11, color: '#b4b4b8', marginBottom: i < d.enumValues!.length - 1 ? 2 : 0 }}>
                {val}
              </div>
            ))}
          </div>
        ) : d.methods.length > 0 ? (
          <div style={{ padding: '8px 14px', background: '#1a1a1e' }}>
            {d.methods.map((m, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color: '#b4b4b8',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: i < d.methods.length - 1 ? 4 : 0,
                }}
              >
                <span style={{ color: visColor(m.visibility), fontWeight: 600, minWidth: 12 }}>{m.visibility}</span>
                <span style={{ color: '#e4e4e7' }}>
                  {hideDetails ? (
                    `${m.name}()`
                  ) : (
                    <>{m.name}(<span style={{ color: '#71717a' }}>{m.params}</span>)</>
                  )}
                </span>
                {!hideDetails && <span style={{ color: '#71717a' }}>: {m.returnType}</span>}
              </div>
            ))}
          </div>
        ) : null}
        {selected && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent pointer-events-none rounded-[10px]" />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
    </>
  );
}

const UMLClassNode = memo(UMLClassNodeInner, (prev, next) =>
  prev.id === next.id &&
  prev.data === next.data &&
  prev.selected === next.selected &&
  (prev as NodeProps & { dragging?: boolean }).dragging === (next as NodeProps & { dragging?: boolean }).dragging
);

const nodeTypes = { umlClass: UMLClassNode };

// ─── Sample class diagram data (nodes only) ──────────────────────
const SAMPLE_CLASSES: Record<string, UMLClassData> = {
  BaseEntity: {
    className: 'BaseEntity',
    abstract: true,
    stereotype: 'abstract',
    attributes: [
      { name: 'id', type: 'string', visibility: '#' },
      { name: 'createdAt', type: 'Date', visibility: '#' },
    ],
    methods: [{ name: 'getId', params: '', returnType: 'string', visibility: '+' }],
  },
  User: {
    className: 'User',
    stereotype: 'entity',
    attributes: [
      { name: 'id', type: 'string', visibility: '-' },
      { name: 'email', type: 'string', visibility: '-' },
    ],
    methods: [
      { name: 'getId', params: '', returnType: 'string', visibility: '+' },
      { name: 'validate', params: '', returnType: 'boolean', visibility: '+' },
    ],
  },
  Account: {
    className: 'Account',
    stereotype: 'entity',
    attributes: [
      { name: 'id', type: 'string', visibility: '-' },
      { name: 'userId', type: 'string', visibility: '-' },
    ],
    methods: [
      { name: 'linkUser', params: 'user: User', returnType: 'void', visibility: '+' },
    ],
  },
  Car: {
    className: 'Car',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Engine: {
    className: 'Engine',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  University: {
    className: 'University',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Student: {
    className: 'Student',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Animal: {
    className: 'Animal',
    stereotype: 'abstract',
    attributes: [],
    methods: [],
  },
  Dog: {
    className: 'Dog',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Driver: {
    className: 'Driver',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Order: {
    className: 'Order',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
  Customer: {
    className: 'Customer',
    stereotype: 'entity',
    attributes: [],
    methods: [],
  },
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 220;

/** Layout uses larger box so variable-size nodes (up to 280px wide, tall with many members) never overlap */
const LAYOUT_BOX_WIDTH = 300;
const LAYOUT_BOX_HEIGHT = 320;
/** Dagre layout options – generous spacing so nodes stay clearly separated */
const LAYOUT_NODESEP = 120;
const LAYOUT_RANKSEP = 200;
const LAYOUT_MARGIN = 50;

function borderPoint(
  cx: number, cy: number, w: number, h: number, tx: number, ty: number,
): [number, number] {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy - h / 2];
  const sx = dx !== 0 ? (w / 2) / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? (h / 2) / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy);
  return [cx + dx * t, cy + dy * t];
}

interface BorderEdgeData {
  x1: number; y1: number; x2: number; y2: number;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  relationship?: 'composition' | 'aggregation' | 'association' | 'directed_association' | 'generalization' | 'dependency';
  [k: string]: unknown;
}

const MULT_ALONG = 12;   // distance along line from node
const MULT_PERP = 10;   // distance perpendicular (beside the line)

function BorderEdgeInner({ id, data, style }: EdgeProps) {
  const d = data as BorderEdgeData | undefined;
  if (!d) return null;
  const dx = d.x2 - d.x1;
  const dy = d.y2 - d.y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  
  const stroke = (style as { stroke?: string })?.stroke ?? '#e4e4e7';
  const rel = d.relationship;
  const isDiamond = rel === 'composition' || rel === 'aggregation';
  const isArrow = rel === 'generalization' || rel === 'directed_association' || rel === 'dependency';

  let lineX1 = d.x1;
  let lineY1 = d.y1;
  let diamondSvg = null;

  if (rel === 'composition') {
    const base = diamondBase(d.x1, d.y1, ux, uy, DEFAULT_DIAMOND_LENGTH);
    lineX1 = base.x;
    lineY1 = base.y;
    diamondSvg = (
      <CompositionDiamond tipX={d.x1} tipY={d.y1} dirX={ux} dirY={uy} stroke={stroke} />
    );
  } else if (rel === 'aggregation') {
    const base = diamondBase(d.x1, d.y1, ux, uy, DEFAULT_DIAMOND_LENGTH);
    lineX1 = base.x;
    lineY1 = base.y;
    diamondSvg = (
      <AggregationDiamond tipX={d.x1} tipY={d.y1} dirX={ux} dirY={uy} stroke={stroke} />
    );
  }

  let lineX2 = d.x2;
  let lineY2 = d.y2;
  let arrowSvg = null;

  if (rel === 'generalization') {
    const base = arrowBase(d.x2, d.y2, ux, uy, DEFAULT_ARROW_LENGTH);
    lineX2 = base.x;
    lineY2 = base.y;
    arrowSvg = (
      <GeneralizationArrow tipX={d.x2} tipY={d.y2} dirX={ux} dirY={uy} stroke={stroke} />
    );
  } else if (rel === 'directed_association' || rel === 'dependency') {
    // lineX2, lineY2 remain d.x2, d.y2 so the line touches the tip
    arrowSvg = (
      <DirectedAssociationArrow tipX={d.x2} tipY={d.y2} dirX={ux} dirY={uy} stroke={stroke} />
    );
  }

  const srcOffset = isDiamond ? MULT_ALONG + DEFAULT_DIAMOND_LENGTH : MULT_ALONG;
  const tgtOffset = rel === 'generalization' ? MULT_ALONG + DEFAULT_ARROW_LENGTH : ((rel === 'directed_association' || rel === 'dependency') ? MULT_ALONG + 10 : MULT_ALONG);
  const sx = d.x1 + ux * srcOffset + px * MULT_PERP;
  const sy = d.y1 + uy * srcOffset + py * MULT_PERP;
  const tx = d.x2 - ux * tgtOffset - px * MULT_PERP;
  const ty = d.y2 - uy * tgtOffset - py * MULT_PERP;

  // Dotted line for dependency
  const isDotted = rel === 'dependency';
  const edgeStyle = { ...style, strokeDasharray: isDotted ? '6, 6' : undefined };

  return (
    <g>
      <BaseEdge id={id} path={`M ${lineX1} ${lineY1} L ${lineX2} ${lineY2}`} style={edgeStyle} />
      {diamondSvg}
      {arrowSvg}
      {d.sourceMultiplicity != null && (
        <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize={11} fontFamily="ui-monospace, monospace">
          {d.sourceMultiplicity}
        </text>
      )}
      {d.targetMultiplicity != null && (
        <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill={stroke} fontSize={11} fontFamily="ui-monospace, monospace">
          {d.targetMultiplicity}
        </text>
      )}
    </g>
  );
}

const BorderEdge = memo(BorderEdgeInner, (prev, next) => {
  if (prev.id !== next.id) return false;
  const pd = prev.data as BorderEdgeData | undefined;
  const nd = next.data as BorderEdgeData | undefined;
  if (!pd || !nd) return pd === nd;
  return pd.x1 === nd.x1 && pd.y1 === nd.y1 && pd.x2 === nd.x2 && pd.y2 === nd.y2 &&
    pd.relationship === nd.relationship && (prev.style as { stroke?: string })?.stroke === (next.style as { stroke?: string })?.stroke;
});

const edgeTypes = { border: BorderEdge };

function buildSampleClassDiagram(): Node[] {
  const nodeIds = Object.keys(SAMPLE_CLASSES);
  return nodeIds.map((id) => ({
    id,
    type: 'umlClass',
    position: { x: 0, y: 0 },
    data: SAMPLE_CLASSES[id] as unknown as Record<string, unknown>,
  }));
}

/**
 * Sort classes so base/super classes tend to come before subclasses (by generalization target).
 * This gives a more readable top-to-bottom flow on the canvas.
 */
function sortClassesForLayout(classes: ApiUmlClass[], relationships: ApiUmlRelationship[]): ApiUmlClass[] {
  const targetsOfGen = new Set(
    relationships
      .filter((r) => r.relationship === 'generalization')
      .map((r) => r.target)
  );
  const idToIndex = new Map(classes.map((c, i) => [c.id, i]));
  const order = [...classes];
  order.sort((a, b) => {
    const aIsBase = !targetsOfGen.has(a.id) ? 0 : 1;
    const bIsBase = !targetsOfGen.has(b.id) ? 0 : 1;
    if (aIsBase !== bIsBase) return aIsBase - bIsBase;
    return idToIndex.get(a.id)! - idToIndex.get(b.id)!;
  });
  return order;
}

function buildNodesFromGeneratedClasses(
  classes: ApiUmlClass[],
  _relationships: ApiUmlRelationship[] = []
): Node[] {
  const sorted = sortClassesForLayout(classes, _relationships);
  return sorted.map((c) => {
    const data: UMLClassData = {
      className: c.className,
      explanation: c.explanation,
      stereotype: c.stereotype,
      abstract: c.abstract,
      isInterface: c.isInterface,
      isEnum: c.isEnum,
      enumValues: c.enumValues,
      attributes: c.attributes || [],
      methods: c.methods || [],
    };
    return {
      id: c.id,
      type: 'umlClass',
      position: { x: 0, y: 0 },
      data: data as unknown as Record<string, unknown>,
    };
  });
}

function buildEdgeDefsFromGeneratedRels(relationships: ApiUmlRelationship[]): EdgeDef[] {
  return relationships.map((r, i) => ({
    id: `e-${r.source}-${r.target}-${i}`,
    source: r.source,
    target: r.target,
    stroke: '#e4e4e7',
    sourceMultiplicity: r.sourceMultiplicity,
    targetMultiplicity: r.targetMultiplicity,
    relationship: r.relationship,
  }));
}

const EDGE_DEFS: EdgeDef[] = [
  { id: 'e-base-user', source: 'BaseEntity', target: 'User', stroke: '#e4e4e7', sourceMultiplicity: '1', targetMultiplicity: '0..1', relationship: 'association' },
  { id: 'e-user-account', source: 'User', target: 'Account', stroke: '#e4e4e7', sourceMultiplicity: '1..*', targetMultiplicity: '*' },
  { id: 'e-car-engine', source: 'Car', target: 'Engine', stroke: '#e4e4e7', relationship: 'composition' },
  { id: 'e-univ-student', source: 'University', target: 'Student', stroke: '#e4e4e7', relationship: 'aggregation' },
  { id: 'e-dog-animal', source: 'Dog', target: 'Animal', stroke: '#e4e4e7', relationship: 'generalization' },
  { id: 'e-driver-car', source: 'Driver', target: 'Car', stroke: '#e4e4e7', relationship: 'directed_association' },
  { id: 'e-order-customer', source: 'Order', target: 'Customer', stroke: '#e4e4e7', relationship: 'dependency' },
];

type EdgeDef = {
  id: string; source: string; target: string; stroke: string;
  sourceMultiplicity?: string; targetMultiplicity?: string;
  relationship?: 'composition' | 'aggregation' | 'association' | 'directed_association' | 'generalization' | 'dependency';
};

/** Minimum gap between node bounding boxes */
const LAYOUT_MIN_GAP = 24;

function resolveOverlaps(nodes: Node[], boxW: number, boxH: number): Node[] {
  let current = nodes.map((n) => ({ ...n, position: { x: n.position.x, y: n.position.y } }));
  const maxPasses = 25;
  for (let pass = 0; pass < maxPasses; pass++) {
    let moved = false;
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i];
        const b = current[j];
        const ax1 = a.position.x;
        const ay1 = a.position.y;
        const ax2 = a.position.x + boxW;
        const ay2 = a.position.y + boxH;
        const bx1 = b.position.x;
        const by1 = b.position.y;
        const bx2 = b.position.x + boxW;
        const by2 = b.position.y + boxH;
        const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
        const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const shiftX = overlapX + LAYOUT_MIN_GAP;
        const shiftY = overlapY + LAYOUT_MIN_GAP;
        const moveRight = b.position.x >= a.position.x;
        const moveDown = b.position.y >= a.position.y;
        const dx = moveRight ? shiftX : -shiftX;
        const dy = moveDown ? shiftY : -shiftY;
        if (overlapX >= overlapY) {
          current[j] = { ...b, position: { x: b.position.x + dx, y: b.position.y } };
        } else {
          current[j] = { ...b, position: { x: b.position.x, y: b.position.y + dy } };
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return current;
}

/**
 * Run Dagre with a given rankdir and return laid-out nodes plus bounding box size.
 */
function runDagreLayout(
  nodes: Node[],
  edgeDefs: EdgeDef[],
  boxW: number,
  boxH: number,
  rankdir: 'TB' | 'LR'
): { nodes: Node[]; width: number; height: number } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir,
    nodesep: LAYOUT_NODESEP,
    ranksep: LAYOUT_RANKSEP,
    marginx: LAYOUT_MARGIN,
    marginy: LAYOUT_MARGIN,
  });
  nodes.forEach((n) => g.setNode(n.id, { width: boxW, height: boxH }));
  edgeDefs.forEach((e) => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  });
  Dagre.layout(g);
  const positioned = new Set<string>();
  const result = nodes.map((n) => {
    const pos = g.node(n.id);
    if (!pos) return n;
    positioned.add(n.id);
    return { ...n, position: { x: pos.x - boxW / 2, y: pos.y - boxH / 2 } };
  });
  const unpositioned = result.filter((n) => !positioned.has(n.id));
  if (unpositioned.length > 0) {
    const maxX = Math.max(0, ...result.map((n) => n.position.x + boxW));
    const maxY = Math.max(0, ...result.map((n) => n.position.y + boxH));
    const COLS = Math.ceil(Math.sqrt(unpositioned.length)) || 1;
    unpositioned.forEach((n, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const idx = result.findIndex((r) => r.id === n.id);
      if (idx !== -1) {
        result[idx] = {
          ...result[idx],
          position: {
            x: LAYOUT_MARGIN + col * (boxW + LAYOUT_NODESEP),
            y: maxY + LAYOUT_MARGIN + row * (boxH + LAYOUT_RANKSEP),
          },
        };
      }
    });
  }
  const minX = Math.min(...result.map((n) => n.position.x));
  const minY = Math.min(...result.map((n) => n.position.y));
  const maxX = Math.max(...result.map((n) => n.position.x + boxW));
  const maxY = Math.max(...result.map((n) => n.position.y + boxH));
  return { nodes: result, width: maxX - minX, height: maxY - minY };
}

/**
 * Apply Dagre layout with a mix of both directions: run TB and LR and pick the result
 * whose bounding box is more balanced (aspect ratio closer to 1), so the diagram uses
 * both horizontal and vertical space instead of a long strip.
 */
function getLayoutedUmlNodes(nodes: Node[], edgeDefs: EdgeDef[]): Node[] {
  if (nodes.length === 0) return [];
  const boxW = LAYOUT_BOX_WIDTH;
  const boxH = LAYOUT_BOX_HEIGHT;
  const hasEdges = edgeDefs.length > 0 && edgeDefs.some((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target));
  let result: Node[];
  if (!hasEdges) {
    const COLS = Math.ceil(Math.sqrt(nodes.length)) || 1;
    result = nodes.map((n, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return {
        ...n,
        position: {
          x: LAYOUT_MARGIN + col * (boxW + LAYOUT_NODESEP),
          y: LAYOUT_MARGIN + row * (boxH + LAYOUT_RANKSEP),
        },
      };
    });
  } else {
    const tb = runDagreLayout(nodes, edgeDefs, boxW, boxH, 'TB');
    const lr = runDagreLayout(nodes, edgeDefs, boxW, boxH, 'LR');
    const aspect = (w: number, h: number) => (w > h ? w / h : h / w);
    const tbAspect = aspect(tb.width, tb.height);
    const lrAspect = aspect(lr.width, lr.height);
    result = tbAspect <= lrAspect ? tb.nodes : lr.nodes;
  }
  return resolveOverlaps(result, boxW, boxH);
}

function computeSmartEdges(nodes: Node[], edgeDefs: EdgeDef[]): Edge[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  return edgeDefs.map((e) => {
    const sn = map.get(e.source);
    const tn = map.get(e.target);
    if (!sn || !tn) return { id: e.id, source: e.source, target: e.target, type: 'border' as const };

    const sw = sn.measured?.width ?? NODE_WIDTH;
    const sh = sn.measured?.height ?? NODE_HEIGHT;
    const tw = tn.measured?.width ?? NODE_WIDTH;
    const th = tn.measured?.height ?? NODE_HEIGHT;

    const scx = sn.position.x + sw / 2;
    const scy = sn.position.y + sh / 2;
    const tcx = tn.position.x + tw / 2;
    const tcy = tn.position.y + th / 2;

    const [x1, y1] = borderPoint(scx, scy, sw, sh, tcx, tcy);
    const [x2, y2] = borderPoint(tcx, tcy, tw, th, scx, scy);

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'border' as const,
      style: { stroke: e.stroke },
      data: {
        x1, y1, x2, y2,
        sourceMultiplicity: e.sourceMultiplicity,
        targetMultiplicity: e.targetMultiplicity,
        relationship: e.relationship,
      },
    };
  });
}

export default function DocumentationUmlPage() {
  const params = useParams<{ orgShortId: string; repoName: string; name: string }>();
  const name = Array.isArray(params?.name) ? params.name[0] : params?.name ?? '';
  const displayName = name ? decodeURIComponent(name) : '';
  const orgShortId = Array.isArray(params?.orgShortId) ? params.orgShortId[0] : params?.orgShortId ?? '';
  const repoName = Array.isArray(params?.repoName) ? params.repoName[0] : params?.repoName ?? '';
  const router = useRouter();
  const rfRef = useRef<ReactFlowInstance | null>(null);
  const [hideDetails, setHideDetails] = useState(false);

  const sampleNodes = useMemo(() => buildSampleClassDiagram(), []);
  const [generatedDiagram, setGeneratedDiagram] = useState<{ classes: ApiUmlClass[]; relationships: ApiUmlRelationship[] } | null>(null);
  const [generatedLoading, setGeneratedLoading] = useState(false);
  const [generatedError, setGeneratedError] = useState<string | null>(null);

  const displayNodes = useMemo(
    () =>
      generatedDiagram && generatedDiagram.classes.length > 0
        ? buildNodesFromGeneratedClasses(generatedDiagram.classes, generatedDiagram.relationships)
        : sampleNodes,
    [generatedDiagram, sampleNodes]
  );
  const displayEdgeDefs = useMemo(
    () =>
      generatedDiagram && generatedDiagram.classes.length > 0
        ? buildEdgeDefsFromGeneratedRels(generatedDiagram.relationships)
        : EDGE_DEFS,
    [generatedDiagram]
  );

  const layoutedNodes = useMemo(
    () => getLayoutedUmlNodes(displayNodes, displayEdgeDefs),
    [displayNodes, displayEdgeDefs]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const edges = useMemo(() => computeSmartEdges(nodes, displayEdgeDefs), [nodes, displayEdgeDefs]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [panelData, setPanelData] = useState<ApiUmlClass | null>(null);

  const classesById = useMemo(() => {
    const map = new Map<string, ApiUmlClass>();
    if (generatedDiagram?.classes) {
      generatedDiagram.classes.forEach((c) => map.set(c.id, c));
    }
    return map;
  }, [generatedDiagram?.classes]);

  const selectedClassForPanel = useMemo((): ApiUmlClass | null => {
    if (!selectedNodeId) return null;
    const fromApi = classesById.get(selectedNodeId);
    if (fromApi) return fromApi;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const d = node.data as unknown as UMLClassData;
    return {
      id: selectedNodeId,
      className: d.className,
      explanation: d.explanation,
      attributes: (d.attributes || []).map((a) => ({
        name: a.name,
        type: a.type,
        visibility: a.visibility,
        description: a.description,
      })),
      methods: (d.methods || []).map((m) => ({
        name: m.name,
        params: m.params,
        returnType: m.returnType,
        visibility: m.visibility,
        description: m.description,
      })),
    };
  }, [selectedNodeId, classesById, nodes]);

  useEffect(() => {
    if (selectedClassForPanel) {
      setPanelData(selectedClassForPanel);
    }
  }, [selectedClassForPanel]);

  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  useEffect(() => {
    const t = setTimeout(() => rfRef.current?.fitView(FIT_VIEW_OPTS), 100);
    return () => clearTimeout(t);
  }, [layoutedNodes]);

  useEffect(() => {
    if (!name || !orgShortId || !repoName) return;
    const slug = decodeURIComponent(name);
    setGeneratedLoading(true);
    setGeneratedError(null);
    const base = orgShortId.startsWith('org-') ? orgShortId : `org-${orgShortId}`;
    fetch(`/api/documentation/uml/diagram?orgShortId=${encodeURIComponent(base)}&repoUrlName=${encodeURIComponent(repoName)}&slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Diagram not found' : res.statusText);
        return res.json();
      })
      .then((data) => {
        const diagramData = data?.diagram?.diagramData ?? data?.diagramData;
        const classes = diagramData?.classes;
        const relationships = diagramData?.relationships;
        if (classes && Array.isArray(classes)) {
          setGeneratedDiagram({
            classes,
            relationships: Array.isArray(relationships) ? relationships : [],
          });
        } else {
          setGeneratedDiagram(null);
        }
      })
      .catch((err) => {
        setGeneratedError(err instanceof Error ? err.message : 'Failed to load diagram');
        setGeneratedDiagram(null);
      })
      .finally(() => setGeneratedLoading(false));
  }, [name, orgShortId, repoName]);

  return (
    <div
      className="h-full flex flex-col bg-[#1a1a1d] relative"
      style={{ borderRadius: 0, overflow: 'hidden', border: '1px solid #262626' }}
    >
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer text-sm font-medium"
          aria-label="Go back"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => setHideDetails((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            hideDetails
              ? 'bg-white/15 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          aria-label={hideDetails ? 'Show type and parameter details' : 'Hide type and parameter details'}
          title={hideDetails ? 'Show details (types, params, return types)' : 'Hide details (show only names)'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.716 0 1.415-.078 2.073-.22M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{hideDetails ? 'Show details' : 'Hide details'}</span>
        </button>
      </div>

      <UmlDetailsContext.Provider value={hideDetails}>
      <div className={`flex-1 flex min-h-0 pr-6 transition-all duration-300 ${selectedNodeId ? 'gap-4' : 'gap-0'}`}>
        <div className="flex-1 min-h-0 relative flex flex-col min-w-0">
          {generatedLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1a1a1d]/80 text-white/60 text-sm">
              Loading diagram…
            </div>
          )}
          {generatedError && !generatedLoading && (
            <div className="absolute top-14 left-4 right-4 z-10 py-2 px-4 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {generatedError}
            </div>
          )}
          <style>{`
            .react-flow__attribution { display: none !important; }
            .react-flow__controls {
              background: #1e1e21 !important;
              border: 1px solid #333 !important;
              border-radius: 6px !important;
            }
            .react-flow__controls-button {
              background: #1e1e21 !important;
              border-bottom: 1px solid #333 !important;
              color: #ccc !important;
            }
            .react-flow__controls-button:hover {
              background: #262626 !important;
              color: #fff !important;
            }
            .react-flow__controls-button:first-child { border-top-left-radius: 6px !important; border-top-right-radius: 6px !important; }
            .react-flow__controls-button:last-child { border-bottom-left-radius: 6px !important; border-bottom-right-radius: 6px !important; border-bottom: none !important; }
          `}</style>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodeClick={(_ev, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={(inst) => { rfRef.current = inst as unknown as ReactFlowInstance; }}
            fitView
            fitViewOptions={FIT_VIEW_OPTS}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
          >
            <Background gap={20} size={1} color="#333338" />
            <Controls
              showInteractive={false}
              style={{ background: '#1e1e21', border: '1px solid #333', borderRadius: 6 }}
            />
          </ReactFlow>
        </div>
        {panelData && (
          <aside
            className={`flex-shrink-0 max-h-[90%] rounded-xl border bg-[#161618]/95 backdrop-blur-xl shadow-2xl overflow-y-auto overflow-x-hidden custom-scrollbar my-auto z-10 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              selectedNodeId
                ? 'w-96 opacity-100 translate-x-0 border-[#333]'
                : 'w-0 opacity-0 translate-x-12 border-transparent pointer-events-none'
            }`}
            style={{ minHeight: 0 }}
          >
            <div className="w-96 flex flex-col">
              <div className="sticky top-0 z-10 bg-[#161618]/95 backdrop-blur-xl border-b border-[#333] px-5 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                  {panelData.className}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(null)}
                  className="text-gray-500 hover:text-white hover:bg-white/10 p-1.5 rounded-md transition-all"
                  aria-label="Close panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 flex flex-col gap-6">
                {/* Description */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Description</h3>
                  <div className="bg-[#1c1c1f] rounded-lg p-3.5 border border-[#2a2a2e]">
                    <p className="text-sm leading-relaxed text-gray-300">
                      {panelData.explanation ?? 'No description available for this class.'}
                    </p>
                  </div>
                </section>

                {/* Attributes */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attributes</h3>
                    <span className="bg-[#2a2a2e] text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {panelData.attributes.length}
                    </span>
                  </div>
                  {panelData.attributes.length === 0 ? (
                    <p className="text-sm text-gray-600 italic px-1">No attributes</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {panelData.attributes.map((a, i) => (
                        <div key={i} className="bg-[#1c1c1f] rounded-lg p-3 border border-[#2a2a2e] hover:border-[#3a3a3e] transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`text-xs font-black w-4 text-center ${
                                a.visibility === '+' ? 'text-emerald-400' :
                                a.visibility === '-' ? 'text-red-400' :
                                a.visibility === '#' ? 'text-amber-400' : 'text-gray-400'
                              }`}>
                                {a.visibility}
                              </span>
                              <span className="text-sm font-medium text-gray-200">{a.name}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono bg-[#161618] px-1.5 py-0.5 rounded border border-[#2a2a2e] whitespace-nowrap">
                              {a.type}
                            </span>
                          </div>
                          {a.description != null && a.description !== '' && (
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{a.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Methods */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Methods</h3>
                    <span className="bg-[#2a2a2e] text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {panelData.methods.length}
                    </span>
                  </div>
                  {panelData.methods.length === 0 ? (
                    <p className="text-sm text-gray-600 italic px-1">No methods</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {panelData.methods.map((m, i) => (
                        <div key={i} className="bg-[#1c1c1f] rounded-lg p-3 border border-[#2a2a2e] hover:border-[#3a3a3e] transition-colors">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className={`text-xs font-black w-4 text-center ${
                              m.visibility === '+' ? 'text-emerald-400' :
                              m.visibility === '-' ? 'text-red-400' :
                              m.visibility === '#' ? 'text-amber-400' : 'text-gray-400'
                            }`}>
                              {m.visibility}
                            </span>
                            <span className="text-sm font-medium text-gray-200">{m.name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="text-gray-500 font-mono bg-[#161618] px-1.5 py-0.5 rounded border border-[#2a2a2e]">
                              ({m.params})
                            </span>
                            {m.returnType && (
                              <>
                                <span className="text-gray-600">→</span>
                                <span className="text-blue-400/80 font-mono">
                                  {m.returnType}
                                </span>
                              </>
                            )}
                          </div>
                          {m.description != null && m.description !== '' && (
                            <p className="text-xs text-gray-400 mt-2.5 pt-2.5 border-t border-[#2a2a2e] leading-relaxed">{m.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </aside>
        )}
      </div>
      </UmlDetailsContext.Provider>
      <div
        className="text-center py-1.5 text-[11px] text-[#555] border-t border-[#262626] flex-shrink-0 leading-snug"
        style={{ background: '#1a1a1d' }}
      >
        UML: {displayName || '—'} — Use scroll wheel to zoom, drag to pan.
      </div>
    </div>
  );
}
