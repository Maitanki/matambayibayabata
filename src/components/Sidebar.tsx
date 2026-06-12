/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tag, Award, ShieldAlert, Heart, MessageSquare } from 'lucide-react';

interface TagItem {
  name: string;
  count: number;
}

interface UserSummary {
  username: string;
  name: string;
  reputation: number;
  avatarUrl?: string;
  role?: string;
}

interface SidebarProps {
  tags: TagItem[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  topUsers: UserSummary[];
  onNavigateUser: (username: string) => void;
}

export default function Sidebar({
  tags,
  selectedTag,
  setSelectedTag,
  topUsers,
  onNavigateUser
}: SidebarProps) {
  // Guidelines / rules of the Matambayi community in standard Hausa
  const guidelines = [
    { text: 'Mutunta Juna: Kada a yi amfani da munanan kalaman batanci.', icon: Heart, color: 'text-orange-600 bg-orange-50' },
    { text: 'Tabbatar da Gaskiya: Raba labari na gaskiya da kwarewa.', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { text: 'Babu Talla: Wannan dandali ne na raba ilimi kadai.', icon: ShieldAlert, color: 'text-slate-700 bg-[#F5F5F0]' }
  ];

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-8" id="app_sidebar">
      
      {/* 1. Popular Tags in Hausa */}
      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-orange-655 flex items-center gap-1.5">
          <Tag className="h-4 w-4" />
          Mabuɗan Kalmomi (Tags)
        </h4>
        
        <div className="flex flex-wrap gap-2" id="sidebar_tags_list">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider border transition-colors cursor-pointer ${
              selectedTag === null
                ? 'bg-[#1A1A1A] text-white border-black/5'
                : 'bg-white text-slate-800 border-black/5 hover:bg-black hover:text-white'
            }`}
          >
            Duka ({tags.reduce((sum, t) => sum + t.count, 0)})
          </button>
          
          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTag(t.name)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1 ${
                selectedTag === t.name
                  ? 'bg-orange-650 text-white border-transparent'
                  : 'bg-white text-slate-800 border-black/5 hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <span>#{t.name}</span>
              <span className={`text-[10px] ${selectedTag === t.name ? 'text-orange-100' : 'text-slate-400 font-normal'}`}>
                ({t.count})
              </span>
            </button>
          ))}
          
          {tags.length === 0 && (
            <p className="text-xs text-slate-400 italic">Babu mabuɗan kalmomi a halin yanzu.</p>
          )}
        </div>
      </div>

      {/* 2. Top Contributors in Hausa (Knowledge Market Leaderboard) */}
      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm" id="contributors_card">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-5 text-[#1A1A1A] flex items-center gap-1.5">
          <Award className="h-4 w-4 text-orange-655" />
          Masu Ilimi na Farko
        </h4>
        
        <div className="flex flex-col gap-4" id="sidebar_leaderboard">
          {topUsers.map((user, idx) => (
            <div
              key={user.username}
              onClick={() => onNavigateUser(user.username)}
              className="flex items-center justify-between group cursor-pointer border-b border-black/5 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-black/5 group-hover:border-orange-500 transition-colors"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white text-[9px] font-bold border border-white">
                    {idx + 1}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-bold text-[#1A1A1A] truncate block group-hover:text-orange-650 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">@{user.username}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-orange-650 block">
                  +{user.reputation}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">maki</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Matambayi Rules & Guidelines in Hausa */}
      <div className="bg-[#F8F7F2] rounded-2xl border border-black/5 p-6 select-none shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-[#1A1A1A] flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-slate-700" />
          Dokokin Matambayi
        </h4>
        <p className="text-xs text-slate-550 leading-relaxed mb-4">
          Domin kiyaye dandalinmu ya kasance cibiyar inganta ilimi mai amfani a kasar Hausa, da fatan biyan wadannan dokoki:
        </p>

        <div className="flex flex-col gap-3.5" id="sidebar_guidelines">
          {guidelines.map((g, idx) => {
            const Icon = g.icon;
            return (
              <div key={idx} className="flex gap-3 items-start bg-white p-2.5 rounded-xl border border-black/5">
                <div className={`p-1.5 rounded-lg shrink-0 ${g.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-[#1A1A1A] font-medium leading-normal">{g.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-black/5 text-[9px] text-slate-440 font-bold uppercase tracking-widest text-center">
          "Sallamar Tambaya ita ce Makullin Ilimi."
        </div>
      </div>

    </aside>
  );
}
