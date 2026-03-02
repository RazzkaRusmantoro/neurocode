import { NodeProps, Handle, Position, EdgeProps, getStraightPath, BaseEdge } from '@xyflow/react';

export function DestroyX({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className} style={style}>
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

export function SequenceMessageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
  markerEnd,
}: EdgeProps) {
  // Always draw a perfectly horizontal line by ignoring targetY and using sourceY.
  // We apply any style transformations here to the group so the label stays with the line.
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY: sourceY,
  });

  const isReturn = !!data?.isReturn;

  return (
    <g style={style}>
      <BaseEdge 
        path={edgePath} 
        id={id} 
        style={{ 
          strokeWidth: 1.5, 
          stroke: '#e4e4e7',
          strokeDasharray: isReturn ? '5, 5' : undefined 
        }} 
        markerEnd={markerEnd} 
      />
      {typeof data?.label === 'string' && data.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={sourceY - 8}
          textAnchor="middle"
          fill="#e4e4e7"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
        >
          {data.label}
        </text>
      )}
    </g>
  );
}

export function SequenceSelfMessageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  data,
  markerEnd,
}: EdgeProps) {
  const dx = 40; // How far out the self-message loops
  
  // If target handle is below source handle, use that difference (min 30px drop)
  const dy = Math.max(30, targetY - sourceY); 
  const actualTargetY = sourceY + dy;

  // Path: out right, down, back left
  // We return to targetX so that if it targets a nested activation (which is shifted right),
  // the arrow correctly touches the edge of the nested box.
  const edgePath = `M ${sourceX} ${sourceY} L ${sourceX + dx} ${sourceY} L ${sourceX + dx} ${actualTargetY} L ${targetX} ${actualTargetY}`;

  return (
    <g style={style}>
      <BaseEdge 
        path={edgePath} 
        id={id} 
        style={{ 
          strokeWidth: 1.5, 
          stroke: '#e4e4e7',
        }} 
        markerEnd={markerEnd} 
      />
      {typeof data?.label === 'string' && data.label && (
        <text
          x={sourceX + dx + 8}
          y={(sourceY + actualTargetY) / 2}
          textAnchor="start"
          dominantBaseline="middle"
          fill="#e4e4e7"
          fontSize={12}
          fontFamily="ui-monospace, monospace"
        >
          {data.label}
        </text>
      )}
    </g>
  );
}

export function SequenceFragmentNode({ data }: NodeProps) {
  const operator = (data.operator as string) || 'alt';
  const condition = data.condition as string; // Optional condition string e.g. "[x > 0]"
  const width = (data.width as number) || 400;
  const height = (data.height as number) || 200;

  // We can measure the length roughly.
  const operatorWidth = Math.max(operator.length * 8 + 16, 40);
  const lw = operatorWidth;
  const lh = 24;
  const cut = 8;

  return (
    <div className="relative pointer-events-none" style={{ width, height }}>
      {/* Outer frame */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="rgba(255,255,255,0.02)" stroke="#e4e4e7" strokeWidth="1.5" />
        
        {/* Label background shape (pentagon with folded right-bottom corner) */}
        <path 
          d={`M 0.5 0.5 L ${lw} 0.5 L ${lw} ${lh - cut} L ${lw - cut} ${lh} L 0.5 ${lh} Z`}
          fill="#1e1e22"
          stroke="#e4e4e7"
          strokeWidth="1.5"
        />
      </svg>
      
      <div className="absolute top-0 left-0 px-2 py-1 text-[#e4e4e7] font-bold text-[11px] font-mono z-10">
        {operator}
      </div>
      {condition && (
        <div className="absolute top-1 text-[#a1a1aa] text-[11px] font-mono z-10" style={{ left: lw + 8 }}>
          {condition}
        </div>
      )}
    </div>
  );
}

/** Step label for section-by-section sequence diagrams (e.g. "Step 1: Request reports"). */
export function SequenceStepLabelNode({ data }: NodeProps) {
  const title = (data.title as string) || '';
  const stepIndex = typeof data.stepIndex === 'number' ? data.stepIndex + 1 : 1;
  return (
    <div className="pointer-events-none flex items-center gap-2">
      <span className="rounded bg-[#2a2a2e] border border-[#444] px-2 py-1 text-[11px] font-semibold text-[#a1a1aa] font-mono">
        Step {stepIndex}
      </span>
      <span className="text-[12px] text-[#e4e4e7] font-mono">{title}</span>
    </div>
  );
}

export function UMLLifelineNode({ data }: NodeProps) {
  const isActor = !!data.isActor;
  const isDestroyed = !!data.isDestroyed;
  const activations = (data.activations as Array<{ startY: number, height: number, xOffset?: number }>) || [];
  const lifelineHeight = typeof data.lifelineHeight === 'number' && data.lifelineHeight > 0 ? data.lifelineHeight : 600;
  return (
    <div className="flex flex-col items-center pointer-events-none" style={{ height: `${lifelineHeight}px`, width: '200px' }}>
      <Handle type="target" position={Position.Left} id="lifeline-target" style={{ opacity: 0, left: '50%', top: '50%' }} />
      <Handle type="source" position={Position.Right} id="lifeline-source" style={{ opacity: 0, left: '50%', top: '50%' }} />
      {isActor ? (
        <div className="flex flex-col items-center mb-1 pointer-events-auto z-10 bg-[#1a1a1d]">
          <svg width="32" height="40" viewBox="0 0 40 50" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[#ccc]">
            <circle cx="20" cy="10" r="8" />
            <line x1="20" y1="18" x2="20" y2="35" />
            <line x1="5" y1="25" x2="35" y2="25" />
            <line x1="20" y1="35" x2="10" y2="48" />
            <line x1="20" y1="35" x2="30" y2="48" />
          </svg>
          <span className="text-white font-semibold mt-1">{data.label as string}</span>
        </div>
      ) : (
        <div className="bg-[#2a2a2e] border border-[#444] rounded-md px-4 py-2 text-white font-semibold min-w-[120px] text-center shadow-md pointer-events-auto z-10">
          {data.label as string}
        </div>
      )}
      <div className="flex-1 w-px border-l-2 border-dashed border-[#555] mt-2 relative flex flex-col items-center justify-end">
        {activations.map((act, i) => (
          <div
            key={i}
            className="absolute bg-[#e4e4e7] border border-[#333] rounded-sm shadow-sm"
            style={{
              top: act.startY,
              height: act.height,
              width: '16px',
              left: `calc(50% + ${act.xOffset || 0}px)`,
              transform: 'translateX(-50%)',
              zIndex: 5 + i,
            }}
          >
            <Handle type="source" position={Position.Right} id={`act-${i}-source-right`} style={{ opacity: 0, top: 0, right: 0 }} />
            <Handle type="target" position={Position.Right} id={`act-${i}-target-right`} style={{ opacity: 0, top: 0, right: 0 }} />
            <Handle type="source" position={Position.Left} id={`act-${i}-source-left`} style={{ opacity: 0, top: 0, left: 0 }} />
            <Handle type="target" position={Position.Left} id={`act-${i}-target-left`} style={{ opacity: 0, top: 0, left: 0 }} />
          </div>
        ))}
        {isDestroyed && (
          <div className="absolute -bottom-5 text-[#e4e4e7] bg-[#1a1a1d] z-10">
            <DestroyX />
          </div>
        )}
      </div>
    </div>
  );
}
