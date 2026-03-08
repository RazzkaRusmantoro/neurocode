'use client';

import {
  Copy,
  Link2,
  Send,
  Search,
  MoreHorizontal,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const ACCENT = 'var(--color-primary)';
const MOCK_INVITE_LINK = 'https://app.neurocode.io/join/abc123';

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  dateJoined: string;
};

function RoleBadge({ role }: { role: 'owner' | 'admin' | 'member' }) {
  const styles =
    role === 'owner'
      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40'
      : role === 'admin'
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
        : 'bg-white/10 text-white/80 border-[#262626]';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border capitalize ${styles}`}>
      {role}
    </span>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center rounded-md bg-[#2a2a2a] border border-[#262626] text-white/90 font-semibold text-sm ${className ?? 'w-9 h-9'}`}
    >
      {initials}
    </div>
  );
}

interface ManagementClientProps {
  members: MemberRow[];
  orgShortId: string;
}

export default function ManagementClient({ members, orgShortId }: ManagementClientProps) {
  const [inviteLink, setInviteLink] = useState(MOCK_INVITE_LINK);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  const filteredMembers = memberSearch.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(memberSearch.trim().toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.trim().toLowerCase())
      )
    : members;

  const toggleMember = useCallback((id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        setSelectedMemberIds((prev) => {
          const next = new Set(prev);
          filteredMembers.forEach((m) => next.add(m.id));
          return next;
        });
      } else {
        setSelectedMemberIds((prev) => {
          const next = new Set(prev);
          filteredMembers.forEach((m) => next.delete(m.id));
          return next;
        });
      }
    },
    [filteredMembers]
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Management</h1>
          <p className="text-white/60">Manage your team members or invite new members to the organization</p>
        </div>
      </div>

      <div className="border-t border-[#262626] mb-8" />

      {/* Team */}
      <section className="mb-8">
        {/* Invite new member */}
        <div className="pb-6 mb-6 border-b border-[#262626]">
          <h2 className="text-lg font-semibold text-white mb-1">Invite new member</h2>
          <p className="text-sm text-white/60 mb-4">Share this link with other users that you would like to join the team</p>
          <div className="flex flex-wrap gap-4 items-stretch">
            {/* Invite link field */}
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden px-2 py-1.5 min-h-0">
              <Link2 className="w-4 h-4 shrink-0 text-white/50 rotate-45" />
              <input
                type="text"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                placeholder="Invite link"
                className="flex-1 min-w-0 bg-transparent px-1 py-1.5 text-white text-sm placeholder-white/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-1.5 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-[#333333] transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-[#404040] origin-right hover:scale-x-105"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
            {/* Email + Send invite */}
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#1a1a1a] border border-[#262626] rounded-lg overflow-hidden px-2 py-1.5 min-h-0">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 min-w-0 bg-transparent px-1 py-1.5 text-white text-sm placeholder-white/40 focus:outline-none"
              />
              <button
                type="button"
                className="shrink-0 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all duration-200 cursor-pointer border-0 origin-right hover:scale-x-105 flex items-center gap-1.5"
                style={{ background: ACCENT }}
              >
                <Send className="w-4 h-4" />
                Send invite
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-1">Team members</h2>
        <p className="text-sm text-white/60 mb-4">View and manage people in this organization</p>
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded text-white text-sm placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
          />
        </div>

        <div className="bg-[#262626]/50 border border-[#262626] rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="w-12 py-4 pl-6 pr-2 text-left">
                    <Checkbox
                      checked={filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.has(m.id))}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-white uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-white uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-white uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-medium text-white uppercase tracking-wider">
                    Date joined
                  </th>
                  <th className="w-12 py-4 px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#121215]/50 transition-colors">
                    <td className="py-4 pl-6 pr-2 w-12">
                      <Checkbox
                        checked={selectedMemberIds.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                        aria-label={`Select ${member.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} />
                        <span className="font-medium text-white">{member.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-white/70">
                      {member.email}
                    </td>
                    <td className="py-4 px-6">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="py-4 px-6 text-sm text-white/70">
                      {member.dateJoined}
                    </td>
                    <td className="py-4 px-6 w-12">
                      <button
                        type="button"
                        className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-[#2a2a2a] transition-colors"
                        aria-label="Manage member"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
