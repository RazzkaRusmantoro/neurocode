'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, Search, Filter, PanelLeftClose, PanelLeft, Box, Braces, Variable, Hash, Target, GitBranch, } from 'lucide-react';
import { useKGState } from '../../../../../_lib/useKGState';
import { FILTERABLE_LABELS, NODE_COLORS, ALL_EDGE_TYPES, EDGE_INFO, type EdgeType } from '../../../../../_lib/constants';
import { GraphNode, NodeLabel } from '../../../../../_lib/types';
interface TreeNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    children: TreeNode[];
    graphNode?: GraphNode;
}
const buildFileTree = (nodes: GraphNode[]): TreeNode[] => {
    const root: TreeNode[] = [];
    const pathMap = new Map<string, TreeNode>();
    const fileNodes = nodes.filter(n => n.label === 'Folder' || n.label === 'File');
    fileNodes.sort((a, b) => a.properties.filePath.localeCompare(b.properties.filePath));
    fileNodes.forEach(node => {
        const parts = node.properties.filePath.split('/').filter(Boolean);
        let currentPath = '';
        let currentLevel = root;
        parts.forEach((part, index) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            let existing = pathMap.get(currentPath);
            if (!existing) {
                const isLastPart = index === parts.length - 1;
                const isFile = isLastPart && node.label === 'File';
                existing = {
                    id: isLastPart ? node.id : currentPath,
                    name: part,
                    type: isFile ? 'file' : 'folder',
                    path: currentPath,
                    children: [],
                    graphNode: isLastPart ? node : undefined,
                };
                pathMap.set(currentPath, existing);
                currentLevel.push(existing);
            }
            currentLevel = existing.children;
        });
    });
    return root;
};
const getNodeTypeIcon = (label: NodeLabel) => {
    switch (label) {
        case 'Folder': return Folder;
        case 'File': return FileCode;
        case 'Class': return Box;
        case 'Function':
        case 'Method': return Braces;
        case 'Interface': return Hash;
        default: return Variable;
    }
};
interface TreeItemProps {
    node: TreeNode;
    depth: number;
    searchQuery: string;
    onNodeClick: (node: TreeNode) => void;
    expandedPaths: Set<string>;
    toggleExpanded: (path: string) => void;
    selectedPath: string | null;
}
const TreeItem = ({ node, depth, searchQuery, onNodeClick, expandedPaths, toggleExpanded, selectedPath }: TreeItemProps) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children.length > 0;
    const matchesSearch = !!searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());
    const filteredChildren = useMemo(() => {
        if (!searchQuery)
            return node.children;
        return node.children.filter(child => child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            child.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [node.children, searchQuery]);
    const handleClick = () => {
        if (hasChildren)
            toggleExpanded(node.path);
        onNodeClick(node);
    };
    return (<div>
      <button onClick={handleClick} className={`w-full flex items-center gap-1.5 px-2 py-[3px] text-left text-xs hover:bg-white/[0.04] transition-colors relative border-l-2 ${isSelected
            ? 'bg-[var(--color-primary)]/10 text-white border-[var(--color-primary)]'
            : 'text-white/50 hover:text-white/80 border-transparent'} ${matchesSearch ? 'bg-[var(--color-primary)]/5' : ''}`} style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        {hasChildren ? (isExpanded
            ? <ChevronDown className="w-3 h-3 shrink-0 text-white/30"/>
            : <ChevronRight className="w-3 h-3 shrink-0 text-white/30"/>) : (<span className="w-3"/>)}
        {node.type === 'folder' ? (isExpanded
            ? <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: NODE_COLORS.Folder }}/>
            : <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: NODE_COLORS.Folder }}/>) : (<FileCode className="w-3.5 h-3.5 shrink-0" style={{ color: NODE_COLORS.File }}/>)}
        <span className="truncate font-mono">{node.name}</span>
      </button>

      {isExpanded && filteredChildren.length > 0 && (<div>
          {filteredChildren.map(child => (<TreeItem key={child.id} node={child} depth={depth + 1} searchQuery={searchQuery} onNodeClick={onNodeClick} expandedPaths={expandedPaths} toggleExpanded={toggleExpanded} selectedPath={selectedPath}/>))}
        </div>)}
    </div>);
};
interface FileTreePanelProps {
    onFocusNode: (nodeId: string) => void;
}
export const FileTreePanel = ({ onFocusNode }: FileTreePanelProps) => {
    const { graph, visibleLabels, toggleLabelVisibility, visibleEdgeTypes, toggleEdgeVisibility, selectedNode, setSelectedNode, openCodePanel, depthFilter, setDepthFilter, } = useKGState();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'files' | 'filters'>('files');
    const fileTree = useMemo(() => (graph ? buildFileTree(graph.nodes) : []), [graph]);
    useEffect(() => {
        if (fileTree.length > 0 && expandedPaths.size === 0) {
            setExpandedPaths(new Set(fileTree.map(n => n.path)));
        }
    }, [fileTree.length]);
    useEffect(() => {
        const path = selectedNode?.properties?.filePath;
        if (!path)
            return;
        const parts = path.split('/').filter(Boolean);
        const pathsToExpand: string[] = [];
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            pathsToExpand.push(currentPath);
        }
        if (pathsToExpand.length > 0) {
            setExpandedPaths(prev => {
                const next = new Set(prev);
                pathsToExpand.forEach(p => next.add(p));
                return next;
            });
        }
    }, [selectedNode?.id]);
    const toggleExpanded = useCallback((path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path))
                next.delete(path);
            else
                next.add(path);
            return next;
        });
    }, []);
    const handleNodeClick = useCallback((treeNode: TreeNode) => {
        if (treeNode.graphNode) {
            const isSameNode = selectedNode?.id === treeNode.graphNode.id;
            setSelectedNode(treeNode.graphNode);
            if (treeNode.type === 'file' || treeNode.graphNode.properties.filePath) {
                openCodePanel();
            }
            if (!isSameNode)
                onFocusNode(treeNode.graphNode.id);
        }
    }, [setSelectedNode, openCodePanel, onFocusNode, selectedNode]);
    const selectedPath = selectedNode?.properties.filePath || null;
    const tabCls = (tab: 'files' | 'filters') => `px-3 py-1.5 text-xs font-medium rounded transition-colors ${activeTab === tab
        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]'
        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`;
    if (isCollapsed) {
        return (<div className="h-full w-12 bg-[#121215] border-r border-[#262626] flex flex-col items-center py-3 gap-1">
        <button onClick={() => setIsCollapsed(false)} className="p-2 text-white/30 hover:text-white/80 hover:bg-white/[0.04] rounded transition-colors" title="Expand">
          <PanelLeft className="w-4 h-4"/>
        </button>
        <div className="w-5 h-px bg-[#262626] my-1"/>
        <button onClick={() => { setIsCollapsed(false); setActiveTab('files'); }} className={`p-2 rounded transition-colors ${activeTab === 'files' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.04]'}`} title="Explorer">
          <Folder className="w-4 h-4"/>
        </button>
        <button onClick={() => { setIsCollapsed(false); setActiveTab('filters'); }} className={`p-2 rounded transition-colors ${activeTab === 'filters' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.04]'}`} title="Filters">
          <Filter className="w-4 h-4"/>
        </button>
      </div>);
    }
    return (<div className="h-full w-64 bg-[#121215] border-r border-[#262626] flex flex-col shrink-0">
      
      <div className="px-3 pt-3 pb-2 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-[var(--color-primary)]"/>
            <span className="text-xs font-semibold text-white/80 tracking-wide">Knowledge Graph</span>
          </div>
          <button onClick={() => setIsCollapsed(true)} className="p-1 text-white/25 hover:text-white/70 hover:bg-white/[0.04] rounded transition-colors" title="Collapse">
            <PanelLeftClose className="w-3.5 h-3.5"/>
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setActiveTab('files')} className={tabCls('files')}>Explorer</button>
          <button onClick={() => setActiveTab('filters')} className={tabCls('filters')}>Filters</button>
        </div>
      </div>

      {activeTab === 'files' && (<>
          <div className="px-3 py-2 border-b border-[#262626]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25"/>
              <input type="text" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-7 pr-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded text-xs text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[var(--color-primary)]/60 transition-colors"/>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
            {fileTree.length === 0 ? (<div className="px-3 py-6 text-center text-white/25 text-xs">No files loaded</div>) : (fileTree.map(node => (<TreeItem key={node.id} node={node} depth={0} searchQuery={searchQuery} onNodeClick={handleNodeClick} expandedPaths={expandedPaths} toggleExpanded={toggleExpanded} selectedPath={selectedPath}/>)))}
          </div>
        </>)}

      {activeTab === 'filters' && (<div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          
          <div className="mb-1">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">Node Types</p>
          </div>
          <div className="flex flex-col gap-0.5">
            {FILTERABLE_LABELS.map(label => {
                const Icon = getNodeTypeIcon(label);
                const isVisible = visibleLabels.includes(label);
                return (<button key={label} onClick={() => toggleLabelVisibility(label)} className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-left transition-colors ${isVisible ? 'bg-[#1a1a1a] text-white/80' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/50'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${isVisible ? '' : 'opacity-40'}`} style={{ backgroundColor: `${NODE_COLORS[label]}20` }}>
                    <Icon className="w-3 h-3" style={{ color: NODE_COLORS[label] }}/>
                  </div>
                  <span className="text-xs flex-1">{label}</span>
                  <div className={`w-2 h-2 rounded-full transition-colors ${isVisible ? 'bg-[var(--color-primary)]' : 'bg-[#262626]'}`}/>
                </button>);
            })}
          </div>

          
          <div className="mt-5 pt-4 border-t border-[#262626]">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">Edge Types</p>
            <div className="flex flex-col gap-0.5">
              {ALL_EDGE_TYPES.map(edgeType => {
                const info = EDGE_INFO[edgeType];
                const isVisible = visibleEdgeTypes.includes(edgeType);
                return (<button key={edgeType} onClick={() => toggleEdgeVisibility(edgeType)} className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-left transition-colors ${isVisible ? 'bg-[#1a1a1a] text-white/80' : 'text-white/30 hover:bg-white/[0.03] hover:text-white/50'}`}>
                    <div className={`w-5 h-1.5 rounded-full ${isVisible ? '' : 'opacity-40'}`} style={{ backgroundColor: info.color }}/>
                    <span className="text-xs flex-1">{info.label}</span>
                    <div className={`w-2 h-2 rounded-full transition-colors ${isVisible ? 'bg-[var(--color-primary)]' : 'bg-[#262626]'}`}/>
                  </button>);
            })}
            </div>
          </div>

          
          <div className="mt-5 pt-4 border-t border-[#262626]">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-3 h-3 text-white/30"/>
              <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Focus Depth</p>
            </div>
            <p className="text-[11px] text-white/25 mb-3">Show nodes within N hops of selection</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: null, label: 'All' },
                { value: 1, label: '1 hop' },
                { value: 2, label: '2 hops' },
                { value: 3, label: '3 hops' },
                { value: 5, label: '5 hops' },
            ].map(({ value, label }) => (<button key={label} onClick={() => setDepthFilter(value)} className={`px-2.5 py-1 text-xs rounded transition-colors ${depthFilter === value
                    ? 'bg-[var(--color-primary)] text-white font-medium'
                    : 'bg-[#1a1a1a] border border-[#262626] text-white/50 hover:text-white/80 hover:border-[var(--color-primary)]/40'}`}>
                  {label}
                </button>))}
            </div>
            {depthFilter !== null && !selectedNode && (<p className="mt-2 text-[10px] text-[var(--color-primary-light)]">Select a node to apply depth filter</p>)}
          </div>

          
          <div className="mt-5 pt-4 border-t border-[#262626]">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
              {(['Folder', 'File', 'Class', 'Function', 'Interface', 'Method'] as NodeLabel[]).map(label => (<div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[label] }}/>
                  <span className="text-[10px] text-white/35">{label}</span>
                </div>))}
            </div>
          </div>
        </div>)}

      
      {graph && (<div className="px-3 py-2 border-t border-[#262626] bg-[#0e0e11]">
          <div className="flex items-center justify-between text-[10px] text-white/25 font-mono">
            <span>{graph.nodes.length} nodes</span>
            <span>{graph.relationships.length} edges</span>
          </div>
        </div>)}
    </div>);
};
