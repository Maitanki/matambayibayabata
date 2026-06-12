/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, LogOut, User, LogIn, PlusCircle, HelpCircle, Activity, Bell, CheckCheck, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { User as UserType, AppNotification } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onLogout: () => void;
  searchVal: string;
  setSearchVal: (val: string) => void;
  onNavigate: (view: { page: 'home' | 'question' | 'profile' | 'admin'; targetId?: string; targetUsername?: string }) => void;
  onOpenAskModal: () => void;
  notifications?: AppNotification[];
  onNotificationClick?: (notif: AppNotification) => void;
  onMarkAllNotificationsRead?: () => void;
}

export default function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  searchVal,
  setSearchVal,
  onNavigate,
  onOpenAskModal,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsRead
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleRequestPushPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(() => {
        // force state refresh
        setShowNotif(false);
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-black/5 h-20 flex items-center shadow-sm select-none" id="main_header">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Logo & Tagline */}
          <div 
            className="flex items-center gap-1.5 sm:gap-3 cursor-pointer shrink-0 select-none" 
            onClick={() => {
              setSearchVal('');
              onNavigate({ page: 'home' });
            }}
            id="logo-container"
          >
            <h1 className="text-base sm:text-2xl font-serif font-black tracking-tight text-[#1A1A1A] transition-colors hover:text-orange-655 shrink-0">
              MATAMBAYI
            </h1>
            <span className="hidden sm:inline-block text-[9px] text-slate-500 font-bold tracking-widest uppercase opacity-60 border-l border-black/10 pl-3 shrink-0">
              Sani Da Fasaha
            </span>
          </div>

          {/* Search Bar - Hausa interface style */}
          <div className="flex-1 max-w-xs sm:max-w-xl mx-1 sm:mx-2 min-w-0" id="search-container">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5 opacity-60" />
              </div>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Nemi Tambaya ko kalmomi..."
                className="block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 bg-[#F5F5F0] border border-black/5 rounded-full placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-655 focus:border-orange-655 text-[11px] sm:text-xs text-slate-800 transition-all font-medium"
                id="search_input"
              />
            </div>
          </div>

          {/* Actions & Profile options */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0" id="actions-container">
            
            {/* Ask Question Button */}
            {currentUser && (
              <button
                onClick={onOpenAskModal}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white text-[11px] sm:text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                id="ask_now_btn"
              >
                <PlusCircle className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Yi Tambaya</span>
              </button>
            )}

            {/* Notification Bell Dropdown */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    setShowMenu(false);
                  }}
                  className="p-2.5 rounded-full hover:bg-[#F5F5F0] transition-all cursor-pointer relative focus:outline-none"
                  id="notif_bell_btn"
                >
                  <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-orange-655 animate-bounce' : 'text-slate-500 hover:text-[#1A1A1A]'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 flex items-center justify-center bg-orange-655 text-white text-[9px] font-bold rounded-full border border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel */}
                {showNotif && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-black/5 shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 focus:outline-none overflow-hidden z-50" id="notifications_dropdown">
                    {/* Header */}
                    <div className="px-4 py-3 bg-[#F8F7F2] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-orange-655" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest select-none">
                          Sanarwa ({unreadCount})
                        </h4>
                      </div>
                      
                      {unreadCount > 0 && onMarkAllNotificationsRead && (
                        <button
                          onClick={() => onMarkAllNotificationsRead()}
                          className="flex items-center gap-1 text-[10px] text-orange-655 hover:text-orange-700 font-bold transition-all uppercase tracking-wider cursor-pointer select-none"
                          id="mark_all_read_btn"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          Karanta Duka
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 select-none">
                          <p className="text-sm italic">Babu sanarwa a halin yanzu.</p>
                          <p className="text-[10px] mt-1 text-slate-400 leading-normal max-w-[240px] mx-auto">Za a sanar da kai a nan idan wani ya amsa tambayoyinka ko lokacin da aka wallafa sababbin fannoni da kake biye da su.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setShowNotif(false);
                              if (onNotificationClick) onNotificationClick(n);
                            }}
                            className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-all text-xs text-slate-700 ${!n.isRead ? 'bg-orange-50/40 border-l-2 border-orange-600 font-medium' : ''}`}
                          >
                            <div className="pt-0.5 shrink-0">
                              {n.type === 'answer' ? (
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                  <MessageSquare className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                                  <Sparkles className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <p className="leading-relaxed text-left">
                                {n.type === 'answer' ? (
                                  <>
                                    <span className="font-bold text-slate-900">@{n.senderName}</span> ya amsa tambayarka da ke cewa: <span className="italic">"{n.questionTitle}"</span>
                                  </>
                                ) : (
                                  <>
                                    Sabuwar tambaya ce akan fannin <span className="font-bold text-orange-700">#{n.topic}</span> da kake biye da shi: <span className="italic">"{n.questionTitle}"</span> tana jira a amsa mata karkashin rubutun <span className="font-bold text-slate-900">@{n.senderName}</span>
                                  </>
                                )}
                              </p>
                              <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5 text-left">
                                {new Date(n.createdAt).toLocaleDateString()} da {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-orange-600 self-center shrink-0"></div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Permissions Footer if needed */}
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                      <div className="p-3 bg-orange-50/50 flex flex-col items-center gap-1.5 text-center">
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">Kuna son samun tura sanarwa koda dandalin yana a rufe?</p>
                        <button
                          onClick={handleRequestPushPermission}
                          className="px-3.5 py-1 bg-orange-655 text-white font-bold text-[9px] rounded-full uppercase tracking-wider hover:bg-orange-700 transition-all cursor-pointer shadow-sm"
                          id="enable_desktop_btn"
                        >
                          Ba Da Ikon Sanarwa
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentUser ? (
              <div className="relative shrink-0 flex items-center">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer shrink-0"
                  id="user_menu_btn"
                >
                  <img
                    src={currentUser.avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80`}
                    alt={currentUser.name}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-orange-200 shadow-sm shrink-0"
                  />
                  <div className="hidden lg:block text-left pr-1 shrink-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">@{currentUser.username}</p>
                    <p className="text-[10px] text-orange-650 font-extrabold flex items-center gap-0.5">
                      ★ {currentUser.reputation} daraja
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-white border border-black/5 shadow-lg ring-1 ring-black/5 divide-y divide-slate-100 focus:outline-none overflow-hidden z-50" id="dropdown_menu">
                    <div className="px-4 py-3 bg-[#F8F7F2]">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kasancewa</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 font-mono font-medium">{currentUser.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-bold border border-orange-200">
                        ★ {currentUser.reputation} maki
                      </div>
                      {currentUser.role === 'admin' && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200 ml-1">
                          Mai Gudanarwa
                        </div>
                      )}
                    </div>
                    {currentUser.role === 'admin' && (
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onNavigate({ page: 'admin' });
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-bold cursor-pointer"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Teburin Gudanarwa
                        </button>
                      </div>
                    )}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onNavigate({ page: 'profile', targetUsername: currentUser.username });
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-755 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Bayanan Mai Amfani
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-650 hover:bg-red-50 transition-colors font-bold cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        Fita daga Dandalin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#F5F5F0] text-slate-705 text-[11px] sm:text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider shrink-0"
                  id="open_login_btn"
                >
                  <LogIn className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>Shiga</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-2.5 sm:px-5 py-1.5 sm:py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white text-[11px] sm:text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider shrink-0"
                  id="open_register_btn"
                >
                  <span className="hidden sm:inline">Yin Rajista</span>
                  <span className="sm:hidden">Rajista</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
