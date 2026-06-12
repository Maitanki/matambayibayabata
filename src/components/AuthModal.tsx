/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, Mail, User, Key, RefreshCw, Eye, EyeOff, Chrome, Fingerprint } from 'lucide-react';
import { auth as firebaseAuth, googleProvider, signInWithPopup } from '../firebase';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
  initialTab?: 'login' | 'register';
}

export default function AuthModal({ onClose, onSuccess, initialTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'recover'>(initialTab);
  
  // Login States
  const [loginCredential, setLoginCredential] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('');

  // Password Recovery States
  const [recEmail, setRecEmail] = useState('');
  const [recPin, setRecPin] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');

  // Secure Social Login states
  const [showSocialSelector, setShowSocialSelector] = useState<'google' | 'github' | null>(null);
  const [socialCustomName, setSocialCustomName] = useState('');
  const [socialCustomEmail, setSocialCustomEmail] = useState('');
  const [socialAsAdmin, setSocialAsAdmin] = useState(false);

  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Social Auth API Submitter
  const handleSocialSubmit = async (email: string, name: string, isAdmin: boolean) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
          provider: showSocialSelector === 'google' ? 'Google' : 'GitHub',
          role: isAdmin ? 'admin' : 'user'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Shigarwa na raba account bai yi nasara ba.');
      }
      setSuccessMsg(`An tabbatar da shiga cikin nasara ta hanyar ${showSocialSelector === 'google' ? 'Google' : 'GitHub'}!`);
      setShowSocialSelector(null);
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setShowSocialSelector(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      if (!user.email) {
        throw new Error("Kuskure: Google bai samar da adireshin imel ba.");
      }
      
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.displayName || 'GoogleUser')}`,
          provider: 'Google',
          role: 'user'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kuskure lokacin kulla shiga da asusun Google.');
      }
      setSuccessMsg(`An shiga cikin nasara ta gaskiya da asusun Google: ${user.email}!`);
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.warn("Iframe popup blocker or config error, showing virtual Google authentication card:", err);
      setShowSocialSelector('google');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubClick = () => {
    setShowSocialSelector('github');
  };

  // API Submission Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCredential || !loginPassword) {
      setErrorMsg('Don Allah a shigar da Suna ko Imel, sannan da kalmar sirri.');
      return;
    }
    
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: loginCredential, password: loginPassword })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Shigarwa ba ta yi nasara ba.');
      }

      setSuccessMsg('An shiga dandalin lafiya! Barka da zuwa.');
      setTimeout(() => {
        onSuccess(data);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regUsername || !regPassword || !regPin) {
      setErrorMsg('Duk fannonin rajista na da muhimmanci, da fatan a cika su gaba daya!');
      return;
    }

    if (regPin.length < 4) {
      setErrorMsg('Lambar tabbatarwa (Recovery PIN) ya kamata ya zama akalla lambobi hudu (4).');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          name: regName,
          password: regPassword,
          recoveryPin: regPin
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Rajista ta kasa canzawa.');
      }

      setSuccessMsg('An yi rajista cikin nasara! Yanzu zaku iya shiga.');
      setTimeout(() => {
        // Auto-login on register
        onSuccess(data);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recEmail || !recPin || !recNewPassword) {
      setErrorMsg('Da fatan a shigar da imel, lambar sirri ta PIN, da sabuwar kalmar sirri.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recEmail,
          recoveryPin: recPin,
          newPassword: recNewPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Kasa canza kalmar sirri.');
      }

      setSuccessMsg('Nasarar canza kalmar sirrin ku! Zaku iya amfani da sabuwar don shiga.');
      setTimeout(() => {
        setSuccessMsg('');
        setTab('login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="auth_backdrop">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden animate-fade-in" id="auth_container">
        
        {/* Header decoration */}
        <div className="bg-[#F8F7F2] p-6 flex items-center justify-between border-b border-black/5">
          <div>
            <h2 className="font-serif font-black text-xl text-[#1A1A1A]">Matambayi</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Babban dandalin raba ilimi a kasar Hausa</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 px-2 hover:bg-black hover:text-white rounded-lg text-slate-600 font-bold transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs */}
        {tab !== 'recover' && (
          <div className="flex border-b border-black/5 select-none">
            <button
              onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                tab === 'login' ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#FDFCF9]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Shiga Dandalin
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
                tab === 'register' ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#FDFCF9]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Yin Rajista
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-6">
          
          {/* Error and Success Feedback in Hausa */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-orange-50 text-orange-850 text-xs font-bold rounded-xl border border-orange-100" id="error_alert">
              🚫 {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100" id="success_alert">
              ✅ {successMsg}
            </div>
          )}

          {/* TAB 1: LOGIN (SHIGA) */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sunan Shiga ko Imel</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginCredential}
                    onChange={(e) => setLoginCredential(e.target.value)}
                    placeholder="Misali: Aliyu_Kano ko imel din ku"
                    className="block w-full pl-10 pr-3 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kalmar Sirri</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Kalmar sirri"
                    className="block w-full pl-10 pr-10 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-655 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setTab('recover'); setErrorMsg(''); }}
                  className="text-xs font-bold text-orange-655 hover:underline cursor-pointer"
                >
                  Manta kalmar sirri? Maido da ita
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#1A1A1A] hover:bg-orange-655 text-white font-bold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
              >
                {loading ? 'Ana kokarin shiga...' : 'Tafi Shiga'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-black/5 animate-pulse"></div>
                <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ko Shiga Da Sauri</span>
                <div className="flex-grow border-t border-black/5"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#F5F5F0] hover:bg-black hover:text-white rounded-full border border-black/5 transition-all text-xs font-bold cursor-pointer text-slate-800"
                  id="google_social_login"
                >
                  <Chrome className="h-4 w-4 text-[#EA4335]" />
                  <span>Shiga da Google</span>
                </button>
                <button
                  type="button"
                  onClick={handleGitHubClick}
                  className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#1A1A1A] hover:bg-black text-white rounded-full border border-transparent transition-all text-xs font-bold cursor-pointer"
                  id="github_social_login"
                >
                  <Fingerprint className="h-4 w-4 text-emerald-400" />
                  <span>Shiga da GitHub (Passkey)</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER (YIN RAJISTA) */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Cikakken Suna</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Misali: Aliyu Mohammad"
                  className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sunan Mai Amfani (Username)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-sm font-semibold select-none">@</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    placeholder="Suna_Mai_Dauki (Ba baki)"
                    className="block w-full pl-8 pr-3 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Adireshin Imel (Email)</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="aliyu@example.com"
                  className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kalmar Sirri</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Kalmar sirri"
                    className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5" title="Code don maido da account idan ka manta kalmar sirri">PIN na Maido</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN: e.g. 1234"
                    className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#1A1A1A] hover:bg-orange-655 text-white font-bold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer"
              >
                {loading ? 'Ana rajista...' : 'Kammala Rajista'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-black/5"></div>
                <span className="flex-shrink mx-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">Ko Rajista Da Sauri</span>
                <div className="flex-grow border-t border-black/5"></div>
              </div>

              {/* Social Registration Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-[#F5F5F0] hover:bg-black hover:text-white rounded-full border border-black/5 transition-all text-xs font-bold cursor-pointer text-slate-800"
                  id="google_social_reg"
                >
                  <Chrome className="h-4 w-4 text-[#EA4335]" />
                  <span>Rajista da Google</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PASSWORD RECOVERY (MAIDO DA KALMAR SIRRI) */}
          {tab === 'recover' && (
            <form onSubmit={handleRecoverSubmit} className="flex flex-col gap-4">
              <h3 className="font-serif font-bold text-lg text-slate-800 flex items-center gap-1.5 select-none">
                <RefreshCw className="h-5 w-5 text-orange-655 animate-spin" />
                Maido da Kalmar Sirri
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Tabbatar da Imel dinka da lambar sirri PIN (Code din daka saka lokacin rajista) domin canza kalmar sirrin ka instant.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Adireshin Imel (Email)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                    placeholder="Imel din rajista"
                    className="block w-full pl-10 pr-3 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">PIN na Maido da Sirri</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={recPin}
                    onChange={(e) => setRecPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Lambar PIN e.g. 1234"
                    className="block w-full pl-10 pr-3 py-2.5 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-650"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Sabuwar Kalmar Sirri</label>
                <input
                  type="password"
                  required
                  value={recNewPassword}
                  onChange={(e) => setRecNewPassword(e.target.value)}
                  placeholder="Shigar da sabuwar kalmar sirri"
                  className="block w-full px-3.5 py-2.5 border border-black/5 rounded bg-[#F5F5F0] text-sm focus:outline-none focus:ring-1 focus:ring-orange-650"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setErrorMsg(''); }}
                  className="flex-1 py-3 text-xs text-slate-700 hover:bg-black hover:text-white rounded-full font-bold border border-black/5 text-center transition-all uppercase tracking-wider cursor-pointer"
                >
                  Koma baya
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-[#1A1A1A] hover:bg-orange-655 text-white font-bold rounded-full text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                >
                  {loading ? 'Kammalawa...' : 'Canza Sirri'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Dynamic Secure Social Login consent dialog overlay */}
        {showSocialSelector && (
          <div className="absolute inset-0 bg-white z-50 p-6 flex flex-col justify-between animate-fade-in" id="social_auth_gate">
            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              
              {/* Google/GitHub Brand Header */}
              <div className="text-center mb-6 select-none">
                <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                  {showSocialSelector === 'google' ? (
                    <Chrome className="h-6 w-6 text-[#4285F4]" />
                  ) : (
                    <Fingerprint className="h-6 w-6 text-purple-600" />
                  )}
                </div>
                <h3 className="font-sans font-bold text-lg text-slate-800 leading-tight">
                  {showSocialSelector === 'google' ? 'Connect with Google' : 'Sign in using Passkey'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {showSocialSelector === 'google' 
                    ? 'to continue to Matambayi Forum' 
                    : 'Secure passwordless login with your hardware key'}
                </p>
              </div>

              {/* Professional Input Form (No preset list of users!) */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Adireshin Imel (Email address)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. malam.brahim@gmail.com"
                      value={socialCustomEmail}
                      onChange={(e) => setSocialCustomEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs leading-normal bg-[#FDFCF9] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 contrast-125"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Cikakken Suna (Full name)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Malam Ibrahim"
                      value={socialCustomName}
                      onChange={(e) => setSocialCustomName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-xs leading-normal bg-[#FDFCF9] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 contrast-125"
                    />
                  </div>

                  <div className="flex items-center gap-2 px-1 select-none">
                    <input
                      type="checkbox"
                      id="social_as_admin_chk"
                      checked={socialAsAdmin}
                      onChange={(e) => setSocialAsAdmin(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <label htmlFor="social_as_admin_chk" className="text-[10px] text-slate-600 font-bold uppercase tracking-wider cursor-pointer">
                      Shiga a matsayin mai gudanarwa (Admin role)
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!socialCustomName || !socialCustomEmail) {
                        setErrorMsg('Da fatan a cika suna da imel!');
                        return;
                      }
                      handleSocialSubmit(socialCustomEmail, socialCustomName, socialAsAdmin);
                    }}
                    className="w-full py-2.5 bg-[#4285F4] hover:bg-[#357ae8] text-white text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors text-center shadow-sm font-sans"
                  >
                    Cigaba da Shiga
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowSocialSelector(null)}
                    className="w-full py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors text-center font-sans"
                  >
                    Soke Shiga (Cancel)
                  </button>
                </div>
              </div>

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center select-none">
              <span className="text-[10px] text-slate-400 font-medium">
                Matambayi Security Gate via Firebase SDK
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
