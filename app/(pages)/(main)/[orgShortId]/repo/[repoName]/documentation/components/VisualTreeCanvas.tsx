'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type CSSProperties,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// ── Types ──────────────────────────────────────────────────────

interface TreeNodeData {
  name: string;
  type: string;
  path: string;
  description: string;
  details: string;
  purpose: string;
  explanation: string;
  language: string | null;
  children: TreeNodeData[];
  childCount: number;
  usages?: string[];
  line_start?: number | null;
  line_end?: number | null;
  logic_flow?: string[];
  api_calls?: string[];
  dependencies?: string[];
  code_sample?: string;
}

interface VisualTreeCanvasProps {
  repositoryId: string;
  repoFullName: string;
  orgShortId: string;
  repoUrlName: string;
  repoName: string;
}

// ── Colours & helpers ──────────────────────────────────────────

const TYPE_COLOURS: Record<string, string> = {
  repo: '#d56707',
  features: '#d56707',
  domain: '#3b82f6',
  service: '#8b5cf6',
  component: '#06b6d4',
  feature: '#10b981',
  capability: '#14b8a6',
  file: '#f59e0b',
  folder: '#6b7280',
  function: '#ec4899',
  class: '#a855f7',
  code: '#6b7280',
};

function typeColour(type: string) {
  return TYPE_COLOURS[type] || '#6b7280';
}

// ── Grid layout ─────────────────────────────────────────────────

const NODE_W = 260;
const NODE_H = 100;
const COLS = 4;
const COL_GAP = 30;
const ROW_GAP = 80;
const VIEW_MORE_W = 200;
const VIEW_MORE_H = 42;

function buildGridGraph(
  root: TreeNodeData,
  maxVisible: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const children = root.children || [];
  const visible = children.slice(0, maxVisible);
  const hasMore = children.length > maxVisible;
  const remaining = children.length - maxVisible;

  nodes.push({
    id: 'root',
    type: 'treeNode',
    position: { x: -NODE_W / 2, y: 0 },
    data: { ...root, childCount: children.length, children },
  });

  for (let i = 0; i < visible.length; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const rowCount = Math.min(COLS, visible.length - row * COLS);
    const rowWidth = rowCount * NODE_W + (rowCount - 1) * COL_GAP;
    const startX = -rowWidth / 2;

    const x = startX + col * (NODE_W + COL_GAP);
    const y = NODE_H + ROW_GAP + row * (NODE_H + ROW_GAP);

    const child = visible[i];
    const cid = `root-${i}`;

    nodes.push({
      id: cid,
      type: 'treeNode',
      position: { x, y },
      data: { ...child, childCount: child.children?.length || 0, children: child.children || [] },
    });
    edges.push({ id: `e-root-${cid}`, source: 'root', target: cid, type: 'animated' });
  }

  if (hasMore) {
    const lastRowIdx = Math.ceil(visible.length / COLS);
    const y = NODE_H + ROW_GAP + lastRowIdx * (NODE_H + ROW_GAP);
    nodes.push({
      id: 'view-more',
      type: 'viewMore',
      position: { x: -VIEW_MORE_W / 2, y },
      data: { remaining },
    });
  }

  return { nodes, edges };
}

// ── Custom animated dashed edge ────────────────────────────────

function AnimatedDashedEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        stroke: '#555',
        strokeWidth: 1.5,
        strokeDasharray: '10 6',
        animation: 'dashmove 1s linear infinite',
      }}
    />
  );
}

// ── Custom tree node ───────────────────────────────────────────

function TreeNodeCard({ data }: NodeProps) {
  const d = data as unknown as TreeNodeData & { childCount: number };
  const colour = typeColour(d.type);
  const nameRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const el = nameRef.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, [d.name]);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />
      <div
        onMouseEnter={() => isTruncated && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          width: NODE_W,
          background: '#1e1e21',
          border: '1px solid #333',
          borderLeft: `3px solid ${colour}`,
          borderRadius: 8,
          padding: '10px 12px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          position: 'relative',
        }}
        className="hover:!border-[var(--color-primary)]"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background: `${colour}22`,
              color: colour,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {d.type}
          </span>
          {d.childCount > 0 && (
            <span style={{ fontSize: 10, color: '#888', marginLeft: 'auto' }}>
              +{d.childCount}
            </span>
          )}
        </div>
        <div
          ref={nameRef}
          style={{
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {d.name}
        </div>

        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -4,
              transform: 'translateY(-100%)',
              background: '#111',
              border: '1px solid #444',
              borderRadius: 6,
              padding: '6px 10px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              maxWidth: 400,
              zIndex: 50,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            {d.name}
          </div>
        )}

        <div
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 11,
            marginTop: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.35',
          }}
        >
          {d.purpose || d.description || ''}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </>
  );
}

// ── View More button node ──────────────────────────────────────

function ViewMoreButton({ data }: NodeProps) {
  const remaining = (data as any).remaining as number;
  return (
    <div
      style={{
        width: VIEW_MORE_W,
        height: VIEW_MORE_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#262626',
        border: '1px dashed #555',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#d56707',
        fontSize: 13,
        fontWeight: 600,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      className="hover:!bg-[#333] hover:!border-[#d56707]"
    >
      View {remaining} more…
    </div>
  );
}

// ── Detail sidebar ─────────────────────────────────────────────

function DetailSidebar({
  node,
  onClose,
}: {
  node: TreeNodeData & { childCount: number };
  onClose: () => void;
}) {
  const colour = typeColour(node.type);

  const Section = ({ title, children: ch }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#888',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: '1.5' }}>
        {ch}
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: 360,
        minWidth: 360,
        height: '100%',
        background: '#18181b',
        borderLeft: '1px solid #333',
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="custom-scrollbar"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: `${colour}22`,
              color: colour,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {node.type}
          </span>
          <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 8, wordBreak: 'break-word' }}>
            {node.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: 18,
            padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {(node.language || node.path || node.line_start) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {node.language && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#262626', color: '#aaa' }}>
              {node.language}
            </span>
          )}
          {node.path && node.path !== '.' && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#262626', color: '#aaa', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.path}
            </span>
          )}
          {node.line_start != null && node.line_end != null && (
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: '#262626', color: '#aaa' }}>
              L{node.line_start}–{node.line_end}
            </span>
          )}
        </div>
      )}

      {(node.purpose || node.description) && (
        <Section title="Purpose">{node.purpose || node.description}</Section>
      )}
      {node.explanation && (
        <Section title="How It Works">{node.explanation}</Section>
      )}
      {node.details && node.details !== node.description && (
        <Section title="Details">{node.details}</Section>
      )}
      {node.code_sample && (
        <Section title="Code">
          <pre
            style={{
              background: '#111',
              padding: 10,
              borderRadius: 6,
              fontSize: 11,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 200,
              color: '#ccc',
            }}
          >
            {node.code_sample}
          </pre>
        </Section>
      )}
      {node.logic_flow && node.logic_flow.length > 0 && (
        <Section title="Logic Flow">
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {node.logic_flow.map((step, i) => (
              <li key={i} style={{ marginBottom: 4, color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {step}
              </li>
            ))}
          </ol>
        </Section>
      )}
      {node.api_calls && node.api_calls.length > 0 && (
        <Section title="API Calls">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {node.api_calls.map((c, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#262626', color: '#d56707' }}>
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}
      {node.dependencies && node.dependencies.length > 0 && (
        <Section title="Dependencies">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {node.dependencies.map((d, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#262626', color: '#aaa', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d}
              </span>
            ))}
          </div>
        </Section>
      )}
      {node.usages && node.usages.length > 0 && (
        <Section title="Referenced In">
          {node.usages.map((u, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
              {u}
            </div>
          ))}
        </Section>
      )}
      {node.childCount > 0 && (
        <Section title={`Children (${node.childCount})`}>
          {(node.children || []).slice(0, 20).map((ch, i) => (
            <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
              <span style={{ color: typeColour(ch.type), fontSize: 10, marginRight: 4 }}>[{ch.type}]</span>
              {ch.name}
            </div>
          ))}
          {node.childCount > 20 && (
            <div style={{ fontSize: 11, color: '#666' }}>… and {node.childCount - 20} more</div>
          )}
        </Section>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

const nodeTypes = { treeNode: TreeNodeCard, viewMore: ViewMoreButton };
const edgeTypes = { animated: AnimatedDashedEdge };
const FIT_VIEW_OPTS = { padding: 0.18, maxZoom: 0.85, duration: 300 };

export default function VisualTreeCanvas({
  repositoryId,
  repoFullName,
  orgShortId,
  repoUrlName,
  repoName,
}: VisualTreeCanvasProps) {
  const [treeData, setTreeData] = useState<TreeNodeData | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<TreeNodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<(TreeNodeData & { childCount: number }) | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxVisible, setMaxVisible] = useState(8);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const rfRef = useRef<ReactFlowInstance | null>(null);
  const fitViewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentRoot = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1] : treeData;

  const doFitView = useCallback(() => {
    if (fitViewTimer.current) clearTimeout(fitViewTimer.current);
    fitViewTimer.current = setTimeout(() => {
      rfRef.current?.fitView(FIT_VIEW_OPTS);
    }, 60);
  }, []);

  // Build grid graph from current root
  const rebuildGraph = useCallback(
    (root: TreeNodeData | null, maxVis: number) => {
      if (!root) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: n, edges: e } = buildGridGraph(root, maxVis);
      setNodes(n);
      setEdges(e);
    },
    [setNodes, setEdges]
  );

  useEffect(() => {
    rebuildGraph(currentRoot ?? null, maxVisible);
  }, [currentRoot, maxVisible, rebuildGraph]);

  // Fit view whenever nodes change or sidebar opens/closes (resizes canvas)
  useEffect(() => {
    if (nodes.length > 0) doFitView();
  }, [nodes, selectedNode, doFitView]);

  // Poll the status endpoint; drives both initial load and generation tracking
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/visual-tree/${repositoryId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (cancelled) return;

        if (data.status === 'generating') {
          setGenerating(true);
          setLoading(false);

          const elapsed = data.elapsedMs ?? 0;
          const pct = Math.min(92, (elapsed / 120_000) * 90);
          setProgress(pct);

          if (!progressTimer) {
            progressTimer = setInterval(() => {
              setProgress((p) => (p >= 92 ? p : p + (92 - p) * 0.02));
            }, 800);
          }

          pollTimer = setTimeout(poll, 3000);
          return;
        }

        if (progressTimer) {
          clearInterval(progressTimer);
          progressTimer = null;
        }

        if (data.status === 'completed' && data.tree) {
          setProgress(100);
          setTimeout(() => {
            if (!cancelled) {
              setGenerating(false);
              setProgress(0);
            }
          }, 600);
          setTreeData(data.tree);
          setError(null);
        } else if (data.status === 'failed') {
          setGenerating(false);
          setProgress(0);
          setError(data.error || 'Generation failed');
          if (data.tree) setTreeData(data.tree);
        } else {
          setGenerating(false);
          setProgress(0);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [repositoryId]);

  // Generate handler
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress(0);
    setError(null);
    setBreadcrumb([]);
    setSelectedNode(null);
    setMaxVisible(8);

    try {
      const res = await fetch('/api/visual-tree/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName, orgShortId, repoUrlName, branch: 'main' }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Generation failed');
      }

      const pollUntilDone = async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const r = await fetch(`/api/visual-tree/${repositoryId}`);
            const d = await r.json();

            if (d.status === 'generating') {
              const elapsed = d.elapsedMs ?? 0;
              setProgress(Math.min(92, (elapsed / 120_000) * 90));
              continue;
            }

            if (d.status === 'completed' && d.tree) {
              setProgress(100);
              setTreeData(d.tree);
              setError(null);
              setTimeout(() => {
                setGenerating(false);
                setProgress(0);
              }, 600);
              return;
            }

            setGenerating(false);
            setProgress(0);
            setError(d.error || 'Generation failed');
            if (d.tree) setTreeData(d.tree);
            return;
          } catch {
            // retry
          }
        }
      };

      pollUntilDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setGenerating(false);
      setProgress(0);
    }
  }, [repoFullName, orgShortId, repoUrlName, repositoryId]);

  // Node click: shift+click → details, viewMore → expand,
  // root node → go back, child with children → drill down, leaf → details
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type === 'viewMore') {
        setMaxVisible((prev) => prev + 8);
        return;
      }

      const d = node.data as unknown as TreeNodeData & { childCount: number };

      if (event.shiftKey) {
        setSelectedNode(d);
        return;
      }

      // Clicking the root (parent) node navigates back
      if (node.id === 'root') {
        if (breadcrumb.length > 0) {
          setBreadcrumb((prev) => prev.slice(0, -1));
          setSelectedNode(null);
          setMaxVisible(8);
        }
        return;
      }

      // Child node with children → drill down
      if (d.childCount > 0) {
        setBreadcrumb((prev) => [...prev, d]);
        setSelectedNode(null);
        setMaxVisible(8);
      } else {
        // Leaf node → show details only, no breadcrumb change
        setSelectedNode(d);
      }
    },
    [breadcrumb.length]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (node.type === 'viewMore') return;
      setSelectedNode(node.data as unknown as TreeNodeData & { childCount: number });
    },
    []
  );

  const navigateBreadcrumb = useCallback(
    (idx: number) => {
      if (idx < 0) {
        setBreadcrumb([]);
      } else {
        setBreadcrumb((prev) => prev.slice(0, idx + 1));
      }
      setSelectedNode(null);
      setMaxVisible(8);
    },
    []
  );

  // Search filter
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      nodes
        .filter((n) => {
          if (n.type === 'viewMore') return false;
          const d = n.data as unknown as TreeNodeData;
          return (
            d.name?.toLowerCase().includes(q) ||
            d.description?.toLowerCase().includes(q) ||
            d.type?.toLowerCase().includes(q)
          );
        })
        .map((n) => n.id)
    );
  }, [nodes, searchQuery]);

  const styledNodes = useMemo(() => {
    if (!filteredNodeIds) return nodes;
    return nodes.map((n) => ({
      ...n,
      style: n.type === 'viewMore' || filteredNodeIds.has(n.id)
        ? {}
        : ({ opacity: 0.25, pointerEvents: 'none' } as CSSProperties),
    }));
  }, [nodes, filteredNodeIds]);

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
      {/* Generate button + loading bar */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            if (treeData) {
              setConfirmInput('');
              setShowConfirmModal(true);
            } else {
              handleGenerate();
            }
          }}
          disabled={generating}
          className="relative px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded text-white text-sm font-semibold overflow-hidden transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="relative z-[1]">
            {generating ? 'Generating...' : treeData ? 'Regenerate Visual Tree' : 'Generate Visual Tree'}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
        </button>

        {breadcrumb.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigateBreadcrumb(-1)}
              style={{ background: 'none', border: 'none', color: '#d56707', cursor: 'pointer', fontSize: 12, padding: 0 }}
            >
              Root
            </button>
            {breadcrumb.map((bc, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#555' }}>/</span>
                <button
                  onClick={() => navigateBreadcrumb(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: i === breadcrumb.length - 1 ? '#fff' : '#d56707',
                    cursor: i === breadcrumb.length - 1 ? 'default' : 'pointer',
                    fontSize: 12,
                    padding: 0,
                  }}
                >
                  {bc.name}
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ marginLeft: 'auto', position: 'relative', width: 220 }}>
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: 6,
              border: '1px solid #333',
              background: '#1a1a1d',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Orange loading bar */}
      {generating && (
        <div style={{ width: '100%', height: 3, background: '#262626', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #d56707, #f59e0b)',
              borderRadius: 2,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* Main area */}
      <div style={{ display: 'flex', flexDirection: 'column', height: generating ? 'calc(100% - 58px)' : 'calc(100% - 48px)', borderRadius: 8, overflow: 'hidden', border: '1px solid #262626' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* React Flow canvas */}
          <div style={{ flex: 1, position: 'relative', background: '#1a1a1d' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                Loading...
              </div>
            ) : error ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', fontSize: 14, padding: 24, textAlign: 'center' }}>
                {error}
              </div>
            ) : !treeData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', gap: 8 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ fontSize: 14 }}>No visual tree yet</span>
                <span style={{ fontSize: 12, color: '#555' }}>Click &quot;Generate Visual Tree&quot; to create one</span>
              </div>
            ) : (
              <>
                <style>{`
                  @keyframes dashmove {
                    to { stroke-dashoffset: -16; }
                  }
                  .react-flow__attribution { display: none !important; }
                `}</style>
                <ReactFlow
                  nodes={styledNodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodeClick={onNodeClick}
                  onNodeContextMenu={onNodeContextMenu}
                  onInit={(instance) => { rfRef.current = instance; }}
                  fitView
                  fitViewOptions={FIT_VIEW_OPTS}
                  minZoom={0.1}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={20} size={1} color="#2a2a2d" />
                  <Controls
                    showInteractive={false}
                    style={{ background: '#1e1e21', border: '1px solid #333', borderRadius: 6 }}
                  />
                </ReactFlow>
              </>
            )}
          </div>

          {/* Detail sidebar */}
          {selectedNode && (
            <DetailSidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </div>

        {/* Help text */}
        <div
          style={{
            textAlign: 'center',
            padding: '6px 0',
            fontSize: 11,
            color: '#555',
            background: '#1a1a1d',
            borderTop: '1px solid #262626',
            lineHeight: 1.6,
            flexShrink: 0,
          }}
        >
          Use scroll wheel to zoom in/out, drag to move around.
          <br />
          Shift+click to view details.
        </div>
      </div>

      {/* Regeneration confirmation modal */}
      {showConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              background: '#1e1e21',
              border: '1px solid #333',
              borderRadius: 12,
              padding: '28px 32px',
              width: 460,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
              Regenerate Visual Tree?
            </h3>
            <p style={{ color: '#999', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
              This will replace the current tree. To confirm, type{' '}
              <span style={{ color: '#d56707', fontWeight: 600 }}>{repoFullName}</span>{' '}
              below.
            </p>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={repoFullName}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmInput === repoFullName) {
                  setShowConfirmModal(false);
                  handleGenerate();
                }
                if (e.key === 'Escape') setShowConfirmModal(false);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #444',
                background: '#141416',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                marginBottom: 20,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: '1px solid #444',
                  background: 'transparent',
                  color: '#aaa',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleGenerate();
                }}
                disabled={confirmInput !== repoFullName}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: confirmInput === repoFullName ? '#d56707' : '#333',
                  color: confirmInput === repoFullName ? '#fff' : '#666',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: confirmInput === repoFullName ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
