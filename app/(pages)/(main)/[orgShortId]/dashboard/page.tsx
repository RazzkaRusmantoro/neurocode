'use client';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const ACCENT = 'var(--color-primary)';

// Impact activity mock data (Last 7 Days)
const IMPACT_DATA = [
  { day: 'Mon', score: 20, reason: 'AuthService + PaymentService updated' },
  { day: 'Tue', score: 35, reason: 'API gateway config changed' },
  { day: 'Wed', score: 60, reason: 'AuthService + PaymentService updated' },
  { day: 'Thu', score: 40, reason: 'Database migrations merged' },
  { day: 'Fri', score: 75, reason: 'AuthService + PaymentService updated' },
  { day: 'Sat', score: 30, reason: 'Minor dependency bumps' },
  { day: 'Sun', score: 50, reason: 'AuthService + PaymentService updated' },
];

// Needs your attention – mock cards
const ATTENTION_ITEMS = [
  {
    module: 'AuthService',
    summary: 'Breaking change in token validation; new claims required for SSO.',
    feature: 'Login flow',
    impact: 'High' as const,
  },
  {
    module: 'PaymentService',
    summary: 'New webhook signature format. Old format deprecated in 30 days.',
    feature: 'Checkout',
    impact: 'High' as const,
  },
  {
    module: 'api-gateway',
    summary: 'Rate limit defaults updated. May affect high-traffic clients.',
    feature: 'API usage',
    impact: 'Medium' as const,
  },
  {
    module: 'data-processor',
    summary: 'Schema change for event payloads. Optional fields added.',
    feature: 'Analytics pipeline',
    impact: 'Low' as const,
  },
];

// Recent changes – mock list
const RECENT_CHANGES = [
  { module: 'AuthService', summary: 'Token validation logic updated', feature: 'Login flow', time: '3h ago' },
  { module: 'PaymentService', summary: 'Webhook signing algorithm changed', feature: 'Checkout', time: '5h ago' },
  { module: 'api-gateway', summary: 'Rate limit config merged to main', feature: 'API usage', time: '1d ago' },
  { module: 'data-processor', summary: 'New optional fields in event schema', feature: 'Analytics pipeline', time: '2d ago' },
];

function ImpactChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: (typeof IMPACT_DATA)[0] }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-[#212121] border border-[#424242] rounded-lg p-3 shadow-lg">
      <p className="text-white/60 text-xs mb-1">{p.day}</p>
      <p className="text-white font-semibold">
        Impact score: <span style={{ color: ACCENT }}>{p.score}</span>
      </p>
      <p className="text-white/70 text-xs mt-1">{p.reason}</p>
    </div>
  );
}

function ImpactBadgeVariant({ level }: { level: 'Stable' | 'Moderate Activity' | 'High Activity' }) {
  const styles =
    level === 'High Activity'
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : level === 'Moderate Activity'
        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30'
        : 'bg-white/10 text-white/80 border-[#262626]';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {level}
    </span>
  );
}

function ImpactBadge({ impact }: { impact: 'Low' | 'Medium' | 'High' }) {
  const styles =
    impact === 'High'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : impact === 'Medium'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-white/10 text-white/70 border-[#262626]';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
      {impact}
    </span>
  );
}

export default function DashboardPage() {
  const activityLevel: 'Stable' | 'Moderate Activity' | 'High Activity' = 'Moderate Activity';

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* 1. Page Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Home</h1>
          <p className="text-white/60">AI-powered insights based on your current work</p>
        </div>
        <div className="flex items-center gap-3">
          <ImpactBadgeVariant level={activityLevel} />
        </div>
      </div>

      {/* 2. Impact Activity (Last 7 Days) */}
      <section className="mb-8">
        <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Impact Activity</h3>
            <p className="text-sm text-white/50">Trend of changes affecting your assigned features</p>
          </div>
          <div className="w-full h-[240px] -mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={IMPACT_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="day"
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#666"
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  tickFormatter={(v) => String(v)}
                  width={32}
                  tickMargin={5}
                />
                <Tooltip content={<ImpactChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ fill: ACCENT, r: 3, strokeWidth: 2, stroke: '#121215' }}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 3. Needs Your Attention */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Needs Your Attention</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ATTENTION_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-base font-bold text-white">{item.module}</h4>
                <ImpactBadge impact={item.impact} />
              </div>
              <p className="text-sm text-white/70 mb-2 line-clamp-2">{item.summary}</p>
              <p className="text-xs text-white/50 mb-4">Affects your feature: {item.feature}</p>
              <button
                type="button"
                className="mt-auto w-fit py-2 px-4 rounded-lg text-sm font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white transition-colors"
              >
                View Change
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent Changes Relevant to You */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Changes Relevant to You</h3>
        <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#262626]">
            {RECENT_CHANGES.map((row, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 px-6 hover:bg-[#121215]/50 transition-colors"
              >
                <span className="font-medium text-white text-sm">{row.module}</span>
                <span className="text-sm text-white/70 flex-1 min-w-0">{row.summary}</span>
                <span className="text-xs text-white/50">Feature: {row.feature}</span>
                <span className="text-xs text-white/50">{row.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
