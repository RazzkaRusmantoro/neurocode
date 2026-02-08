'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Interactive Line Chart Component using Recharts
function InteractiveLineChart({ data, color = '#7c3aed', name = 'Value' }: { data: number[], color?: string, name?: string }) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  const chartData = data.map((value, index) => {
    const monthIndex = (currentMonth - (data.length - 1 - index)) % 12;
    const monthName = monthNames[monthIndex >= 0 ? monthIndex : monthIndex + 12];
    return {
      name: monthName,
      value: value,
      fullName: monthNames[monthIndex >= 0 ? monthIndex : monthIndex + 12]
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#212121] border border-[#424242] rounded-lg p-3 shadow-lg">
          <p className="text-white/60 text-xs mb-1">{payload[0].payload.fullName}</p>
          <p className="text-white font-semibold">
            {name}: <span style={{ color }}>{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[200px] -mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis 
            dataKey="name" 
            stroke="#666" 
            fontSize={10}
            tick={{ fill: '#666' }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={50}
            tickMargin={8}
          />
          <YAxis 
            stroke="#666" 
            fontSize={10}
            tick={{ fill: '#666' }}
            tickFormatter={(value) => value.toLocaleString()}
            width={45}
            tickMargin={5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#gradient-${color.replace('#', '')})`}
            dot={{ fill: color, r: 3, strokeWidth: 2, stroke: '#121215' }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const pathname = usePathname();
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    // Hash navigation can be added here if needed
  }, [pathname]);

  // Extract organization name from pathname or use default
  const orgMatch = pathname.match(/\/org-([^/]+)/);
  const orgShortId = orgMatch ? orgMatch[1] : null;
  const orgName = 'Your Organization'; // This can be passed as prop or fetched

  // Fake data
  const commitData = [1240, 1320, 1180, 1450, 1620, 1780, 1950, 1820, 2100, 2250, 2380, 2450];
  const prData = [45, 52, 38, 61, 67, 73, 82, 75, 89, 94, 98, 102];
  const contributorData = [12, 13, 11, 14, 15, 16, 17, 16, 18, 19, 20, 21];

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-white/60">{orgName}</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSelectedPeriod('7')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                selectedPeriod === '7'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setSelectedPeriod('30')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                selectedPeriod === '30'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setSelectedPeriod('90')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                selectedPeriod === '90'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Last 90 days
            </button>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <section id="overview" className="py-6">
        {/* Three Analytics Graphs + Subscription Promotion */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Graph 1: Code Commits */}
          <div className="lg:col-span-1 bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white/70">Code Commits</h3>
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">2,450</span>
                <span className="text-sm text-green-400 font-medium">+18.2%</span>
              </div>
              <p className="text-xs text-white/50 mt-1">This month</p>
            </div>
            <div className="flex-1 min-h-[200px] w-full -mb-2 pb-0">
              <InteractiveLineChart data={commitData} color="#7c3aed" name="Commits" />
            </div>
          </div>

          {/* Graph 2: Pull Requests */}
          <div className="lg:col-span-1 bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white/70">Pull Requests</h3>
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">102</span>
                <span className="text-sm text-green-400 font-medium">+12.5%</span>
              </div>
              <p className="text-xs text-white/50 mt-1">This month</p>
            </div>
            <div className="flex-1 min-h-[200px] w-full -mb-2 pb-0">
              <InteractiveLineChart data={prData} color="#3b82f6" name="Pull Requests" />
            </div>
          </div>

          {/* Graph 3: Active Contributors */}
          <div className="lg:col-span-1 bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 flex flex-col">
            <div className="mb-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white/70">Contributors</h3>
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">21</span>
                <span className="text-sm text-green-400 font-medium">+5.0%</span>
              </div>
              <p className="text-xs text-white/50 mt-1">Active this month</p>
            </div>
            <div className="flex-1 min-h-[200px] w-full -mb-2 pb-0">
              <InteractiveLineChart data={contributorData} color="#10b981" name="Contributors" />
            </div>
          </div>

          {/* Subscription Promotion Block */}
          <div className="lg:col-span-1 bg-gradient-to-br from-[#7c3aed]/20 via-[#5C42CE]/15 to-[#7c3aed]/10 backdrop-blur-sm border border-[#7c3aed]/40 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c3aed]/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded-full mb-3">
                  <svg className="w-3 h-3 text-[#7c3aed]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#7c3aed]">PRO</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Upgrade to Pro</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  Unlock advanced analytics, unlimited repositories, priority support, and AI-powered code insights.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced analytics & insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unlimited repositories</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AI-powered code insights</span>
                </div>
              </div>
              <button className="w-full py-3 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-lg font-semibold transition-colors text-sm">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>

        {/* Documentation Relevancy Section */}
        <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Documentation Coverage</h3>
              <p className="text-sm text-white/50">Track documentation quality and coverage across repositories</p>
            </div>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] transition-colors font-medium">
              View details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[#121215] rounded-lg border border-[#262626]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70">Overall Coverage</span>
                <span className="text-lg font-bold text-white">72%</span>
              </div>
              <div className="h-2 bg-[#212121] rounded-full overflow-hidden">
                <div className="h-full bg-[#7c3aed] rounded-full" style={{ width: '72%' }}></div>
              </div>
              <p className="text-xs text-white/50 mt-2">+8% from last month</p>
            </div>
            <div className="p-4 bg-[#121215] rounded-lg border border-[#262626]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70">API Documentation</span>
                <span className="text-lg font-bold text-white">85%</span>
              </div>
              <div className="h-2 bg-[#212121] rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-white/50 mt-2">+12% from last month</p>
            </div>
            <div className="p-4 bg-[#121215] rounded-lg border border-[#262626]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/70">Code Comments</span>
                <span className="text-lg font-bold text-white">68%</span>
              </div>
              <div className="h-2 bg-[#212121] rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <p className="text-xs text-white/50 mt-2">+5% from last month</p>
            </div>
          </div>
        </div>

        {/* Repository Activity Table */}
        <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
    <div>
              <h3 className="text-lg font-semibold text-white mb-1">Active Repositories</h3>
              <p className="text-sm text-white/50">Most active in the last 7 days</p>
            </div>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] transition-colors font-medium">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/70 uppercase tracking-wide">Repository</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/70 uppercase tracking-wide">Commits</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/70 uppercase tracking-wide">PRs</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-white/70 uppercase tracking-wide">Contributors</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'neurocode-frontend', commits: 47, prs: 8, contributors: 12 },
                  { name: 'api-gateway', commits: 32, prs: 5, contributors: 8 },
                  { name: 'data-processor', commits: 28, prs: 3, contributors: 6 },
                  { name: 'backend-service', commits: 24, prs: 6, contributors: 15 },
                  { name: 'mobile-app', commits: 19, prs: 4, contributors: 5 },
                ].map((repo, idx) => (
                  <tr key={idx} className="border-b border-[#262626] hover:bg-[#121215] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-white font-medium text-sm">{repo.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white text-sm">{repo.commits}</td>
                    <td className="py-4 px-4 text-white text-sm">{repo.prs}</td>
                    <td className="py-4 px-4 text-white text-sm">{repo.contributors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Platform Services Section */}
      <section className="py-10 border-t border-[#262626]">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Platform Services</h2>
          <p className="text-white/60">Explore powerful features to enhance your development workflow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Code Documentation</h3>
            <p className="text-sm text-white/60 mb-4">
              Automatically generate comprehensive documentation for your codebase using AI-powered analysis.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>

          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Code Analysis</h3>
            <p className="text-sm text-white/60 mb-4">
              Get intelligent insights about code quality, patterns, and potential improvements across your repositories.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>

          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automated Testing</h3>
            <p className="text-sm text-white/60 mb-4">
              Set up and manage automated test suites with intelligent test generation and coverage tracking.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>

          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Code Learning Hub</h3>
            <p className="text-sm text-white/60 mb-4">
              Interactive tutorials and guides to help your team understand and work with your codebase effectively.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>

          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Performance Analytics</h3>
            <p className="text-sm text-white/60 mb-4">
              Track and optimize your application performance with detailed metrics and recommendations.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>

          <div className="bg-[#171717]/50 backdrop-blur-sm border border-[#262626] rounded-xl p-6 hover:border-[#7c3aed]/50 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Scanning</h3>
            <p className="text-sm text-white/60 mb-4">
              Automated security vulnerability detection and remediation suggestions for your codebase.
            </p>
            <button className="text-sm text-[#7c3aed] hover:text-[#8b5cf6] font-medium">
              Learn more →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
