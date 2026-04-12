'use client';
import { useRef, useCallback } from 'react';
import { ChevronRight, Bell, UserPlus, Share2 } from 'lucide-react';
import { FileTreePanel } from './FileTreePanel';
import { GraphCanvas, GraphCanvasHandle } from './GraphCanvas';
import { CodePanel } from './CodePanel';
import { StatusBar } from './StatusBar';
import { useKGState } from '../../../../../_lib/useKGState';
function KGNavbar() {
    const { repoId, graph } = useKGState();
    const [owner, repo] = (repoId ?? '').split('/');
    const nodeCount = graph?.nodeCount ?? 0;
    const edgeCount = graph?.relationships.length ?? 0;
    return (<header className="flex items-center h-[72px] px-8 shrink-0 border-b border-white/[0.05]" style={{ background: '#0a0a0d', fontFamily: 'var(--font-poppins)' }}>
      
      <img src="/Full-logo.png" alt="NeuroCode" className="h-8 w-auto shrink-0 mr-8"/>

      
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-white/40 font-medium truncate hidden sm:block">{owner}</span>
        <ChevronRight className="w-4 h-4 text-white/20 shrink-0 hidden sm:block"/>
        <span className="text-sm text-white/75 font-semibold truncate">{repo}</span>
        <ChevronRight className="w-4 h-4 text-white/20 shrink-0"/>

        
        <span className="text-sm font-semibold" style={{ background: 'linear-gradient(90deg, #d56707, #f59f43)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Knowledge Graph
        </span>
      </div>

      
      {nodeCount > 0 && (<div className="hidden lg:flex items-center gap-2 ml-6 px-3 py-1 rounded-full border border-white/[0.07] text-[11px] text-white/30" style={{ background: 'rgba(255,255,255,0.025)', fontFamily: 'ui-monospace, monospace' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#d56707]/70"/>
          {nodeCount.toLocaleString()} nodes · {edgeCount.toLocaleString()} edges
        </div>)}

      <div className="flex-1"/>

      
      <div className="flex items-center gap-1">
        {[
            { icon: UserPlus, label: 'Invite' },
            { icon: Bell, label: 'Notifications' },
            { icon: Share2, label: 'Share' },
        ].map(({ icon: Icon, label }) => (<button key={label} aria-label={label} className="p-2 text-white/40 hover:text-white/80 transition-colors duration-200 cursor-pointer rounded-lg hover:bg-white/[0.05]">
            <Icon className="w-4 h-4"/>
          </button>))}

        
        <button onClick={() => window.history.back()} className="ml-2 px-4 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] transition-all duration-200">
          ← Back
        </button>
      </div>
    </header>);
}
export default function ExplorerUI() {
    const canvasRef = useRef<GraphCanvasHandle>(null);
    const handleFocusNode = useCallback((nodeId: string) => {
        canvasRef.current?.focusNode(nodeId);
    }, []);
    return (<div className="flex flex-col w-full h-full" style={{ background: '#121215' }}>
      <KGNavbar />
      <div className="flex flex-1 overflow-hidden">
        
        <FileTreePanel onFocusNode={handleFocusNode}/>
        <CodePanel />

        
        <div className="flex-1 relative overflow-hidden">
          <GraphCanvas ref={canvasRef}/>
        </div>
      </div>
      <StatusBar />
    </div>);
}
