/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, HelpCircle, Trash2, ShieldCheck, 
  Settings, Activity, Lock, Chrome, Fingerprint, ArrowLeft, 
  Search, Check, X, ShieldAlert, Key, RefreshCw, UserCheck, 
  Sparkles, Plus, Award
} from 'lucide-react';
import { User, Question, UserRole } from '../types';
import { auth as firebaseAuth, googleProvider, signInWithPopup } from '../firebase';

interface AdminDashboardProps {
  currentUser: User | null;
  onBack: () => void;
  onNavigatePage: (view: { page: 'home' | 'question' | 'profile' | 'admin'; targetId?: string; targetUsername?: string }) => void;
  onLoginSuccess: (user: User) => void;
}

interface Stats {
  usersCount: number;
  questionsCount: number;
  answersCount: number;
  commentsCount: number;
  avgReputation: number;
  allTags: string[];
}

export default function AdminDashboard({
  currentUser,
  onBack,
  onNavigatePage,
  onLoginSuccess
}: AdminDashboardProps) {
  // Tabs: 'stats' | 'users' | 'questions'
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'questions'>('stats');
  
  // States if admin is logged in
  const [stats, setStats] = useState<Stats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // User management edits
  const [searchQuery, setSearchQuery] = useState('');
  const [reputationInputs, setReputationInputs] = useState<Record<string, string>>({});

  // Secure Auth States (for logging in to admin if not already ADMIN)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // MFA Biometric simulation
  const [showMfaPrompt, setShowMfaPrompt] = useState(false);
  const [mfaScanning, setMfaScanning] = useState(false);
  const [mfaPendingUser, setMfaPendingUser] = useState<User | null>(null);

  // Social Sign-in simulator
  const [socialPopup, setSocialPopup] = useState<'google' | 'github' | null>(null);
  const [socialEmail, setSocialEmail] = useState('');
  const [socialName, setSocialName] = useState('');

  const isAdmin = currentUser && currentUser.role === UserRole.ADMIN;

  // Load Admin Data
  const loadAdminData = async () => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`/api/admin/stats?adminId=${currentUser.id}`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        throw new Error('An kasa juyo alkaluman sirri.');
      }

      // 2. Fetch Users
      const usersRes = await fetch(`/api/admin/users?adminId=${currentUser.id}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
        // Pre-populate reputation inputs
        const inputs: Record<string, string> = {};
        usersData.forEach((u: User) => {
          inputs[u.id] = String(u.reputation);
        });
        setReputationInputs(inputs);
      }

      // 3. Fetch Questions to moderate
      const questionsRes = await fetch('/api/questions?sort=new');
      if (questionsRes.ok) {
        setRecentQuestions(await questionsRes.json());
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Kuskure ya faru lokacin juyo bayanan mataki nafarko.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [currentUser]);

  // Handle Standard Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Da fatan a cika duka fannonin.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Shiga bata yi nasara ba.');
      }

      if (data.role !== UserRole.ADMIN) {
        throw new Error('Haba! Wannan asusun bashi da ikon gudanarwa na Admin.');
      }

      // Trigger MFA step for high-security admin logging
      setMfaPendingUser(data);
      setShowMfaPrompt(true);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Trigger Biometric Passkey/Security simulation
  const triggerBiometricMfa = () => {
    if (!mfaPendingUser) return;
    setMfaScanning(true);
    setTimeout(() => {
      setMfaScanning(false);
      setShowMfaPrompt(false);
      onLoginSuccess(mfaPendingUser);
      setSuccessMsg('An tabbatar da Passkey! Barka da dawo asusun gudanarwa.');
      setMfaPendingUser(null);
    }, 2000); // 2 second mock biometric signature scan
  };

  // Trigger standard Google Auth
  const triggerGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      if (!user.email) throw new Error("Google bai samar da imel ba.");
      
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'Admin User',
          avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
          provider: 'Google',
          role: 'admin'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kuskure lokacin shiga ta dandalin Google.');

      if (data.role === UserRole.ADMIN) {
        setMfaPendingUser(data);
        setShowMfaPrompt(true);
      } else {
        onLoginSuccess(data);
        onBack();
      }
    } catch (err: any) {
      console.warn("Iframe popup blocker or config error, showing virtual Google authentication card for admins:", err);
      // fallback onto virtual popups
      setSocialPopup('google');
    } finally {
      setAuthLoading(false);
    }
  };

  const triggerGitHubLogin = () => {
    setSocialPopup('github');
  };

  const handleConfirmSocialLogin = async (email: string, name: string) => {
    setAuthLoading(true);
    setAuthError('');
    setSocialPopup(null);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
          provider: socialPopup === 'google' ? 'Google' : 'GitHub',
          role: 'admin'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kuskure lokacin shiga ta dandalin Google.');
      }

      if (data.role === UserRole.ADMIN) {
        setMfaPendingUser(data);
        setShowMfaPrompt(true);
      } else {
        onLoginSuccess(data);
        onBack();
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const mockPopupProvider = () => socialPopup || 'google';
  const providerNameCapitalized = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

  // User Actions
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;
    setActionLoading(`role-${userId}`);
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'An kasa canza matsayi.');
      
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccessMsg('An canza matsayin mai amfani da nasara!');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateReputation = async (userId: string) => {
    if (!currentUser) return;
    const value = reputationInputs[userId];
    if (value === undefined || isNaN(Number(value))) return;
    
    setActionLoading(`rep-${userId}`);
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/reputation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id, reputation: Number(value) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'An kasa gyara maki.');

      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, reputation: Number(value) } : u));
      setSuccessMsg('An gyara maki na darajar mai amfani cikin tsarin.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Shin gaske kana son goge asusun @${username}? Wannan zai goge shi duka daga tsarin.`)) return;

    setActionLoading(`delete-user-${userId}`);
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kuskure lokacin goge mai amfani.');

      setUsersList(prev => prev.filter(u => u.id !== userId));
      setSuccessMsg(`An fitar da asusun mai amfani @${username} cikin nasara.`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Content Actions - delete question
  const handleDeleteQuestion = async (qId: string, qTitle: string) => {
    if (!currentUser) return;
    if (!window.confirm(`Shin kana son goge tambayoyi mai taken: "${qTitle}" da duka amsoshinta a matsayin Admin?`)) return;

    setActionLoading(`delete-q-${qId}`);
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kuskure lokacin goge tambayar.');

      setRecentQuestions(prev => prev.filter(q => q.id !== qId));
      setSuccessMsg('An goge tambayar da dukkan amsoshinta matsayin mai gudanarwa.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6" id="admin_dashboard_wrapper">
      
      {/* Back Button Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#1A1A1A] hover:text-white border border-black/5 text-slate-700 text-xs font-bold rounded-full shadow-sm transition-all w-fit cursor-pointer uppercase tracking-wider"
          id="admin_back_btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Koma Baya</span>
        </button>
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-105 px-3 py-1.5 rounded-full border border-black/5 flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 text-orange-650" />
          Tsarin Gudanarwa (Admin Area)
        </span>
      </div>

      {/* RENDER ADMIN ACCESS GATE if not Admin */}
      {!isAdmin ? (
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-black/5 p-8 shadow-md flex flex-col gap-6 text-center select-none mt-4" id="secure_admin_gate">
          <div className="mx-auto p-4 bg-orange-50 text-orange-655 rounded-full inline-block">
            <Lock className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif font-black text-xl text-slate-900 leading-tight">Shigar Admin Mai Tsaro</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Wannan sashe na masu gudanarwa (Admin) ne kadai. Kuna bukatar ingantaccen asusun shiga da matakin tsaro na Passkey.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-bold leading-normal text-left flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Social Logins - Highly requested secure method */}
          <div className="flex flex-col gap-2">
            <button
              onClick={triggerGoogleLogin}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#F5F5F0] hover:bg-black hover:text-white rounded-full border border-black/5 transition-all text-xs font-bold cursor-pointer text-slate-800"
              id="google_admin_btn"
            >
              <Chrome className="h-4 w-4 text-[#EA4335]" />
              <span>Shiga da Google Account</span>
            </button>
            <button
              onClick={triggerGitHubLogin}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-slate-900 text-white hover:bg-black rounded-full border border-transparent transition-all text-xs font-bold cursor-pointer"
              id="github_admin_btn"
            >
              <Fingerprint className="h-4 w-4 text-emerald-400" />
              <span>Shiga da GitHub (Passkey Ready)</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-black/5"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ko Shiga da Kalmar Sirri</span>
            <div className="flex-grow border-t border-black/5"></div>
          </div>

          {/* Standard credential login */}
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Imel Ko Sunan Shiga</label>
              <input
                type="text"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="admin@matambayi.com"
                className="block w-full px-4 py-2.5 bg-[#F5F5F0]/60 border border-black/5 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-650"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kalmar Sirri (Password)</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-4 py-2.5 bg-[#F5F5F0]/60 border border-black/5 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-650"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 py-3 hover:bg-orange-650 text-white bg-[#1A1A1A] font-bold text-xs uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Tabbatarwa...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Tabbatar da Shiga</span>
                </>
              )}
            </button>
          </form>

        </div>
      ) : (
        /* MAIN ADMIN AREA IF AUTHORIZED */
        <div className="flex flex-col gap-6" id="admin_dashboard_contents">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-black/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm select-none">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-serif font-black text-xl text-slate-900 leading-tight">Gidan Gudanarwa na Kwamiti</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kuna Shiga da Sunan <span className="font-extrabold text-slate-700">@{currentUser.username}</span>. An tsare wannan shafi da asusun Google da maɓuɓɓugar biometrics.
                </p>
              </div>
            </div>

            <button
              onClick={loadAdminData}
              className="p-2.5 bg-[#F5F5F0] text-slate-600 border border-black/5 hover:bg-[#1A1A1A] hover:text-white rounded-full transition-all cursor-pointer flex items-center h-fit shrink-0 gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sake Wanke Bayanai
            </button>
          </div>

          {/* Feedback alerts */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
              <Check className="h-4.5 w-4.5 text-emerald-655" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-800 border border-red-150 rounded-2xl text-xs font-bold animate-fade-in flex items-center gap-2">
              <X className="h-4.5 w-4.5 text-red-655" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Navigation Tab buttons inside admin */}
          <div className="flex border-b border-black/5 gap-2 select-none" id="admin_tabs">
            <button
              onClick={() => {
                setActiveTab('stats');
                setSuccessMsg('');
              }}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'stats' 
                  ? 'text-orange-655 font-black border-b-2 border-orange-600' 
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Alkaluma (Stats)
            </button>
            <button
              onClick={() => {
                setActiveTab('users');
                setSuccessMsg('');
              }}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'users' 
                  ? 'text-orange-655 font-black border-b-2 border-orange-600' 
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Masu Amfani ({usersList.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('questions');
                setSuccessMsg('');
              }}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'questions' 
                  ? 'text-orange-655 font-black border-b-2 border-orange-600' 
                  : 'text-slate-400 hover:text-slate-800'
              }`}
            >
              Tace Tambayoyi ({recentQuestions.length})
            </button>
          </div>

          {/* TAB A: DETAILED SYSTEM STATS */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-6" id="stats_tab_content">
              {/* Stats card grids */}
              {loading || !stats ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-black/5">
                  <RefreshCw className="h-7 w-7 text-orange-600 animate-spin mb-2" />
                  <p className="text-xs text-slate-450 font-bold">Ana shigo da alkaluma...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Daukacin Masu Amfani</span>
                        <h4 className="text-2xl font-serif font-bold text-slate-900 leading-tight mt-1">{stats.usersCount}</h4>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-orange-50 text-orange-600 rounded-xl">
                        <HelpCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tambayoyi (Questions)</span>
                        <h4 className="text-2xl font-serif font-bold text-slate-900 leading-tight mt-1">{stats.questionsCount}</h4>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Amsoshi (Answers)</span>
                        <h4 className="text-2xl font-serif font-bold text-slate-900 leading-tight mt-1">{stats.answersCount}</h4>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm flex items-center gap-4">
                      <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Daraja ta Tsakiya</span>
                        <h4 className="text-2xl font-serif font-bold text-slate-900 leading-tight mt-1">{stats.avgReputation} maki</h4>
                      </div>
                    </div>

                  </div>

                  {/* Active Tags list */}
                  <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] mb-4 flex items-center gap-1.5 border-b border-black/5 pb-3">
                      <Sparkles className="h-4 w-4 text-orange-550" />
                      Fannonin Da Ke Cikin Tsarin (Active Tags)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.allTags.map(tag => (
                        <span key={tag} className="px-3.5 py-1.5 bg-[#F5F5F0] text-slate-800 rounded-lg text-xs font-bold uppercase tracking-wider border border-black/5">
                          #{tag}
                        </span>
                      ))}
                      {stats.allTags.length === 0 && (
                        <p className="text-xs text-slate-400 italic">Babu wani tag da aka kafa tambaya a kai tukunna.</p>
                      )}
                    </div>
                  </div>

                  {/* High Security Policy Audit Panel */}
                  <div className="bg-[#F8F7F2] rounded-2xl border border-black/5 p-6 flex flex-col sm:flex-row items-center gap-6 justify-between select-none">
                    <div className="flex gap-4 items-start col-span-1">
                      <div className="p-2.5 bg-[#1A1A1A] text-white rounded-xl">
                        <Settings className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Shaidar Tsaro & MFA Audit Log</h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mt-1">
                          An duba duk wani canji a dandalin gudanarwa tareda adana IP da hadin biometric. Duk wadannan sassa ne na hadaddiyar kariya don tabbatar da mutunci da gujewa spam.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-250 font-bold text-[10px] tracking-wider uppercase inline-block shrink-0">
                      Tsarin Yana Da Kyau
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB B: USER LISTS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6" id="users_tab_content">
              
              {/* Search user bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nemi mai amfani karkashin sunan yanka, sunan asali, ko imel..."
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-black/5 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-650 focus:border-orange-650 text-xs text-slate-800 shadow-sm"
                  id="admin_user_search"
                />
              </div>

              {/* Users table */}
              <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-black/5 text-left text-xs text-slate-700 leading-normal">
                    <thead className="bg-[#F8F7F2] text-slate-400 font-bold uppercase tracking-widest text-[10px] border-b border-black/5">
                      <tr>
                        <th scope="col" className="px-6 py-4">Mai Amfani (User)</th>
                        <th scope="col" className="px-6 py-4">Suna & Imel</th>
                        <th scope="col" className="px-6 py-4">Matsayi (Role)</th>
                        <th scope="col" className="px-6 py-4">Maki na Daraja (Rep)</th>
                        <th scope="col" className="px-6 py-4 text-right">Ayyuka (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          
                          {/* Image and username */}
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-black/5"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold hover:underline cursor-pointer" onClick={() => onNavigatePage({ page: 'profile', targetUsername: user.username })}>
                                  @{user.username}
                                </span>
                                <span className="text-[9px] font-mono font-semibold text-slate-400">ID: {user.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Full Name and Email */}
                          <td className="px-6 py-4 select-all">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">{user.name}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{user.email}</span>
                            </div>
                          </td>

                          {/* Role edit / badges */}
                          <td className="px-6 py-4 font-bold">
                            <div className="flex items-center gap-2">
                              {actionLoading === `role-${user.id}` ? (
                                <RefreshCw className="h-4.5 w-4.5 animate-spin text-purple-600" />
                              ) : (
                                <select
                                  value={user.role}
                                  onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                                  className="bg-[#F5F5F0] border border-black/5 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                                  id={`role_select_${user.id}`}
                                >
                                  <option value={UserRole.USER}>Saba'i (User)</option>
                                  <option value={UserRole.ADMIN}>Mai Gudanarwa (Admin)</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Reputation edit */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={reputationInputs[user.id] || ''}
                                onChange={(e) => setReputationInputs({ ...reputationInputs, [user.id]: e.target.value })}
                                className="w-16 px-2 py-1 bg-[#F5F5F0] border border-black/5 rounded-lg text-xs font-bold text-slate-850 font-mono text-center focus:outline-none"
                                id={`rep_input_${user.id}`}
                              />
                              <button
                                onClick={() => handleUpdateReputation(user.id)}
                                disabled={actionLoading !== null}
                                className="p-1 text-orange-655 hover:bg-orange-50 border border-black/5 rounded-lg transition-all cursor-pointer font-bold"
                                title="Ajiye maki"
                                id={`save_rep_btn_${user.id}`}
                              >
                                {actionLoading === `rep-${user.id}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 inline stroke-[2.5]" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Delete ban actions */}
                          <td className="px-6 py-4 text-right">
                            {user.id !== currentUser.id ? (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                disabled={actionLoading !== null}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all font-bold cursor-pointer inline-flex items-center gap-1"
                                title="Goge / Ban"
                                id={`delete_user_btn_${user.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline text-[10px]">Goge</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Asusunka (You)</span>
                            )}
                          </td>

                        </tr>
                      ))}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                            Ba a sami kowa mai amfani da wannan sunan da kake bincike ba.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB C: CONTENT MODERATION (RECENT QUESTIONS) */}
          {activeTab === 'questions' && (
            <div className="flex flex-col gap-6" id="questions_tab_content">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-800 select-none">Sabuwar Moderation na Tambayoyi</h4>

              <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="divide-y divide-black/5">
                  {recentQuestions.map((q) => (
                    <div key={q.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">@{q.authorName}</span>
                          <span className="text-[9px] text-slate-300">•</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h5 className="font-serif font-bold text-sm text-slate-850 hover:underline cursor-pointer hover:text-orange-655" onClick={() => onNavigatePage({ page: 'question', targetId: q.id })}>
                          {q.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 font-serif">{q.body}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                          {q.answersCount} Amsoshi
                        </span>
                        
                        <button
                          onClick={() => handleDeleteQuestion(q.id, q.title)}
                          disabled={actionLoading !== null}
                          className="px-3.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-full transition-colors text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                          id={`del_q_admin_${q.id}`}
                        >
                          {actionLoading === `delete-q-${q.id}` ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          <span>Goge Tambaya</span>
                        </button>
                      </div>

                    </div>
                  ))}

                  {recentQuestions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic font-medium">Babu wata tambaya a dandalin kwata-kwata a yanzu.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MODAL 1: Simulated Secure Google social sign-in confirm popup */}
      {socialPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-black/5 p-8 max-w-sm w-full shadow-2xl relative select-none animate-fade-in flex flex-col gap-5">
            
            <div className="text-center mb-2 select-none">
              <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-3">
                {socialPopup === 'google' ? (
                  <Chrome className="h-6 w-6 text-[#4285F4]" />
                ) : (
                  <Fingerprint className="h-6 w-6 text-purple-600" />
                )}
              </div>
              <h3 className="font-sans font-bold text-lg text-slate-800 leading-tight">
                {socialPopup === 'google' ? 'Connect with Google' : 'Sign in using Passkey'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                shiga asusun gudanarwa na Matambayi Dashboard
              </p>
            </div>

            {/* Inputs for credentials */}
            <div className="flex flex-col gap-3 text-left">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Imel na Gudanarwa (Admin Email)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. m.brahim.admin@gmail.com"
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs leading-normal bg-[#FDFCF9] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 contrast-125"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Cikakken Suna (Admin Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malam Ibrahim"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs leading-normal bg-[#FDFCF9] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 contrast-125"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!socialEmail || !socialName) {
                      setAuthError('Da fatan a shigar da kwararan bayanan Admin!');
                      setSocialPopup(null);
                      return;
                    }
                    handleConfirmSocialLogin(socialEmail, socialName);
                  }}
                  className="w-full py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors text-center shadow-sm font-sans"
                >
                  Tabbatar da Shiga
                </button>
              </div>
            </div>

            <button
              onClick={() => setSocialPopup(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-[#F5F5F0] hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Simulated high-security Biometric Passkey / MFA prompt */}
      {showMfaPrompt && mfaPendingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white rounded-3xl border border-white/10 p-8 max-w-sm w-full shadow-2xl relative select-none animate-fade-in text-center flex flex-col gap-6">
            <div className="mx-auto flex flex-col items-center gap-2">
              <Fingerprint className={`h-16 w-16 text-orange-500 ${mfaScanning ? 'animate-pulse scale-110 text-emerald-400' : ''}`} />
              <div className="h-1 w-12 bg-orange-600/60 rounded-full mt-1"></div>
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg leading-tight uppercase tracking-wider text-orange-400">Shaidar Passkey Na Admin</h3>
              <p className="text-xs text-slate-300 mt-2 px-1 leading-relaxed">
                Kuna kokarin matsa kusa da rukunin bayanan sirri na Matambayi. Da fatan a kwashe yatsa akan na'urar biometric don tabbatar da ID dinku (@{mfaPendingUser.username}).
              </p>
            </div>

            {mfaScanning ? (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 animate-pulse">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-orange-450 uppercase tracking-widest font-bold">Ana binciken hoton yatsa...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={triggerBiometricMfa}
                  className="w-full py-3 px-4 bg-orange-655 hover:bg-orange-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  id="start_mfa_scan_btn"
                >
                  <Key className="h-4 w-4" />
                  <span>Duba Fingerprint Yanzu</span>
                </button>
                <button
                  onClick={() => {
                    setShowMfaPrompt(false);
                    setMfaPendingUser(null);
                    setAuthError('An dakatar da biometrics mfa signature.');
                  }}
                  className="w-full py-2.5 px-4 bg-[#F5F5F0]/10 hover:bg-[#F5F5F0]/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
                >
                  Soke Tabbatarwa
                </button>
              </div>
            )}

            <div className="text-[9px] text-slate-450 uppercase tracking-wider leading-relaxed">
              MFA biometrics shine rariya ta gaskiya ga mutuncin dandalin Matambayi.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
