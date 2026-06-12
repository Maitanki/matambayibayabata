/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Award, Clock, ArrowLeft, Mail, Shield, User as UserIcon, BookOpen, AlertCircle } from 'lucide-react';
import { Question, User } from '../types';

interface UserProfileProps {
  username: string;
  currentUser: User | null;
  onBack: () => void;
  onSelectQuestion: (qId: string) => void;
  onUpdateCurrentUser?: (user: User) => void;
}

export default function UserProfile({
  username,
  currentUser,
  onBack,
  onSelectQuestion,
  onUpdateCurrentUser
}: UserProfileProps) {
  const [profile, setProfile] = useState<{
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    reputation: number;
    avatarUrl?: string;
    createdAt: string;
    bio?: string;
    interests?: string[];
    questions: Question[];
    answersCount: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Profile Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorUpdateMsg, setErrorUpdateMsg] = useState('');

  // Fetch full user profile from API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        throw new Error('Ba a sami wannan mai amfani ba.');
      }
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !currentUser) return;

    setSaving(true);
    setErrorUpdateMsg('');

    try {
      const parsedInterests = editInterests
        .replace(/[,;]/g, ' ')
        .split(/\s+/)
        .map(t => t.trim().replace(/^#+/, ''))
        .filter(t => t.length > 0);

      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio,
          interests: parsedInterests,
          name: editName
        })
      });

      const updatedData = await res.json();
      if (!res.ok) {
        throw new Error(updatedData.error || 'Sabunta bayanai ya gaza.');
      }

      setProfile(prev => prev ? {
        ...prev,
        name: updatedData.name,
        bio: updatedData.bio,
        interests: updatedData.interests
      } : null);

      setIsEditing(false);

      if (onUpdateCurrentUser) {
        onUpdateCurrentUser({
          ...currentUser,
          name: updatedData.name,
          bio: updatedData.bio,
          interests: updatedData.interests
        });
      }
    } catch (err: any) {
      setErrorUpdateMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-black/5" id="profile_loading">
        <div className="w-8 h-8 border-2 border-orange-655 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A] select-none">Ana loda bayanan mai amfani...</p>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="p-12 bg-[#F8F7F2] text-slate-600 rounded-3xl border border-black/5 text-center flex flex-col items-center gap-6" id="profile_error">
        <AlertCircle className="h-10 w-10 text-orange-655" />
        <h3 className="font-serif font-bold text-xl text-[#1A1A1A]">Ba a sami mutumin da kake nema ba</h3>
        <p className="text-xs font-medium leading-relaxed max-w-md">{errorMsg || 'Ba a sami mai amfani da wannan sunan ba.'}</p>
        <button 
          onClick={onBack}
          className="px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-orange-655 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer uppercase tracking-wider"
        >
          Koma Baya
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === profile.username.toLowerCase();

  return (
    <div className="flex flex-col gap-8" id={`user_profile_${profile.username}`}>
      
      {/* Back to feed navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#F8F7F2] hover:bg-black hover:text-white border border-black/5 text-[#1A1A1A] text-xs font-bold rounded-full shadow-sm transition-all w-fit cursor-pointer animate-fade-in uppercase tracking-wider"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Koma Shafin Farko</span>
      </button>

      {/* Profile Header Block */}
      <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-8">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80'}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-[#F8F7F2] shadow-sm shadow-black/10"
          />

          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-1.5">
              <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] leading-tight">
                {profile.name}
              </h2>
              {profile.role === 'admin' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white text-[9px] font-bold border border-black/5 uppercase tracking-wide">
                  <Shield className="h-3 w-3" />
                  Mai Gudanarwa (Admin)
                </span>
              )}
            </div>

            <p className="text-xs text-orange-655 font-mono font-bold mb-4">@{profile.username}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-[#F8F7F2] border border-black/5 px-2.5 py-1 rounded">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Ya shiga: {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </span>
              
              {isOwnProfile && (
                <span className="flex items-center gap-1.5 bg-[#F8F7F2] border border-black/5 px-2.5 py-1 rounded select-all" title="Email address (Visible only to you)">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{profile.email}</span>
                </span>
              )}
            </div>

            {/* Grid display for statistics */}
            <div className="grid grid-cols-3 max-w-sm gap-3.5 mt-6 bg-[#F8F7F2] p-4 rounded-xl border border-black/5">
              <div className="text-center">
                <span className="block text-lg font-bold text-orange-655 font-mono">
                  ★ {profile.reputation}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Daraja</span>
              </div>
              <div className="text-center border-x border-black/5 px-2">
                <span className="block text-lg font-bold text-[#1A1A1A] font-mono">
                  {profile.questions.length}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Tambayoyi</span>
              </div>
              <div className="text-center">
                <span className="block text-lg font-bold text-[#1A1A1A] font-mono">
                  {profile.answersCount}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Amsoshi</span>
              </div>
            </div>

            {/* Private configuration reminder (Recovery pin, etc) */}
            {isOwnProfile && (
              <div className="mt-5 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3.5 max-w-xl text-xs text-orange-850">
                <Shield className="h-4 w-4 text-orange-650 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Lambar PIN ta tabbatarwa (Recovery PIN) na asusun ka ita ce: <span className="font-mono font-bold text-orange-800 bg-orange-100/60 px-1.5 py-0.5 rounded">{currentUser.recoveryPin}</span>. Da fatan ka ajiye ta da kyau, tana da amfani wajen canza kalmar sirri idan ka manta ita.
                </p>
              </div>
            )}

            {/* Biography, Interests & Profile Editing Section */}
            <div className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-4">
              {!isEditing ? (
                <div className="flex flex-col gap-5">
                  {/* Biography */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">Biyografi (Bio)</h3>
                    {profile.bio ? (
                      <p className="text-sm font-serif text-[#1A1A1A] leading-relaxed basis-full whitespace-pre-wrap">
                        {profile.bio}
                      </p>
                    ) : (
                      <p className="text-xs italic text-slate-400 font-medium">
                        Babu bayanai na biyografi game da wannan mai amfani tukuna. {isOwnProfile && "Danna maballin kasa don rubuta biyografi game da kanka dake nuna kwarewar ka."}
                      </p>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 select-none">Sha'anoni Da Kwarewa (Interests)</h3>
                    {profile.interests && profile.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.interests.map((tag) => (
                          <span 
                            key={tag} 
                            className="px-2.5 py-1 bg-orange-50 border border-orange-100/60 text-orange-850 text-xs font-bold rounded-lg uppercase tracking-wide font-sans"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400 font-medium">
                        Babu zabaɓɓun sha'anoni ko kwarewa ga wannan mai amfani tukuna.
                      </p>
                    )}
                  </div>

                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setEditBio(profile.bio || '');
                        setEditInterests((profile.interests || []).join(' '));
                        setEditName(profile.name || '');
                        setIsEditing(true);
                        setErrorUpdateMsg('');
                      }}
                      className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white text-xs font-bold rounded-full w-fit shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider mt-2 select-none animate-fade-in"
                      id="edit_profile_toggle_btn"
                    >
                      Gyara Bayanai
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 max-w-xl animate-fade-in" id="edit_profile_form">
                  <h3 className="font-serif font-bold text-base text-[#1A1A1A] select-none">
                    Gyara Bayanan Mai Amfani
                  </h3>

                  {errorUpdateMsg && (
                    <div className="p-3 bg-red-50 text-red-800 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{errorUpdateMsg}</span>
                    </div>
                  )}

                  {/* Edit Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 select-none">Cikakken Suna</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Misali: Aliyu Mohammad"
                      className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-655"
                      id="edit_name_input"
                    />
                  </div>

                  {/* Edit Bio */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 select-none">Biyografi (Biyografi)</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Kwatanta kanka, da kwarewar ka, da irin fannonin da kake bayar da taimako a dandalin..."
                      rows={3}
                      className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-655 font-serif"
                      id="edit_bio_input"
                    />
                  </div>

                  {/* Edit Interests */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 select-none">Sha'anoni (Raba kalmomi da tazarar sarari/space)</label>
                    <input
                      type="text"
                      value={editInterests}
                      onChange={(e) => setEditInterests(e.target.value)}
                      placeholder="Misali: Noma Lafiya Tarihi Kasuwanci"
                      className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-655"
                      id="edit_interests_input"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block mt-1 select-none">Raba sha'anoni ta hanyar amfani da sarari ("Space"), misali: Noma Lafiya</span>
                  </div>

                  {/* Save/Cancel actions */}
                  <div className="flex gap-3 mt-1 select-none">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                      id="save_profile_submit_btn"
                    >
                      {saving ? 'Ana ajiye...' : 'Ajiye Bayanai'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 border border-[#1A1A1A]/10 text-slate-700 hover:bg-black hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider"
                      id="cancel_profile_edit_btn"
                    >
                      Soke
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Display of User's Activity details */}
      <div className="mt-2">
        <h3 className="font-serif font-black text-xl text-[#1A1A1A] mb-5 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-655" />
          Tarihin Tambayoyin {profile.name} ({profile.questions.length})
        </h3>

        <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-black/5" id="profile_questions_list">
          {profile.questions.map(q => (
            <div 
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className="bg-white rounded border border-black/5 p-5 hover:bg-[#F8F7F2] transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">
                  Maki: {new Date(q.createdAt).toLocaleDateString('en-US')}
                </span>
                <h4 className="font-serif font-bold text-base text-[#1A1A1A] hover:text-orange-655 transition-colors leading-snug">
                  {q.title}
                </h4>
              </div>
              
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500 pt-3.5 border-t border-black/5">
                <div className="flex flex-wrap gap-1">
                  {q.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-[#F5F5F0] border border-black/5 text-[#1A1A1A] text-[10px] rounded hover:bg-black hover:text-white transition-colors">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 font-bold text-[11px] text-slate-500">
                  <span>{q.votesCount} Maki</span>
                  <span>{q.answersCount} Amsoshi</span>
                </div>
              </div>
            </div>
          ))}

          {profile.questions.length === 0 && (
            <div className="p-12 bg-[#F8F7F2] rounded-2xl border border-dashed border-black/5 text-center text-slate-450 italic text-sm">
              Wannan mai amfani bai riga ya wallafa wata tambaya a dandalin ba riga ya kasance.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
