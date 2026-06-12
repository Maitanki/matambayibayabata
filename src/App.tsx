/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageSquare, Flame, Sparkles, Filter, 
  RefreshCw, AlertCircle, TrendingUp, Compass, BookOpen, Clock
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import QuestionCard from './components/QuestionCard';
import AuthModal from './components/AuthModal';
import AskQuestionForm from './components/AskQuestionForm';
import QuestionDetail from './components/QuestionDetail';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import { Question, User, AppNotification } from './types';

export default function App() {
  // Navigation & View States
  const [view, setView] = useState<{
    page: 'home' | 'question' | 'profile' | 'admin';
    targetId?: string;
    targetUsername?: string;
  }>({ page: 'home' });

  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Trigger OS Native Push Notification
  const triggerNativePushNotification = (n: AppNotification) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const title = n.type === 'answer' ? 'Sabuwar Amsa Ga Tambayarka!' : `Sabuwar Tambaya - #${n.topic}`;
        const body = n.type === 'answer' 
          ? `@${n.senderName} ya amsa tambayarka: "${n.questionTitle}"`
          : `@${n.senderName} ya wallafa tambaya akan #${n.topic}: "${n.questionTitle}"`;
        
        try {
          new Notification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Mark all as read
  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/notifications/read-all`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Click on single notification: mark list as read and navigate
  const handleNotificationClick = async (notif: AppNotification) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/users/${currentUser.id}/notifications/${notif.id}/read`, {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      setView({ page: 'question', targetId: notif.questionId });
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (retryCount = 0) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${currentUser.id}/notifications`);
      if (res.ok) {
        const data: AppNotification[] = await res.json();
        setNotifications(prev => {
          // Find any unread notifs in incoming data that we don't have in prev yet
          const newUnreads = data.filter(
            n => !n.isRead && !prev.some(p => p.id === n.id)
          );
          if (newUnreads.length > 0) {
            newUnreads.forEach(triggerNativePushNotification);
          }
          return data;
        });
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' && retryCount < 3) {
        // Silent retry on startup boot windows
        setTimeout(() => {
          fetchNotifications(retryCount + 1);
        }, 1500);
      } else {
        console.warn('Silent network issue fetching notifications:', err.message);
      }
    }
  };

  // Dynamic Polling of Notifications list
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    // Direct initial load
    fetchNotifications();

    // Query interval of 5 seconds
    const timer = setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentUser]);

  // Request browser desktop permission cleanly if first login
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [currentUser]);

  // Data Lists
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);

  // Filtering & Search
  const [searchVal, setSearchVal] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'new' | 'hot' | 'answers'>('new');

  // Modals Visibility
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);

  // Loading/Refresh Indicators
  const [dataLoading, setDataLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Initial User Session Recovery from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('matambayi_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('matambayi_user');
      }
    }
  }, []);

  // 1b. Deep Link URL Query Param Parser (e.g., ?q=some-id)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('q');
    if (qId) {
      setView({ page: 'question', targetId: qId });
    }
  }, []);

  // 1c. Dynamic Hash Router (e.g., /#admin)
  useEffect(() => {
    const handleHashRouter = () => {
      if (window.location.hash === '#admin') {
        setView((prev) => prev.page === 'admin' ? prev : { page: 'admin' });
      } else if (window.location.hash === '' && view.page === 'admin') {
        setView({ page: 'home' });
      }
    };

    handleHashRouter(); // Check on init
    window.addEventListener('hashchange', handleHashRouter);
    return () => {
      window.removeEventListener('hashchange', handleHashRouter);
    };
  }, [view.page]);

  // Sync state navigation back to URL hash
  useEffect(() => {
    if (view.page === 'admin') {
      if (window.location.hash !== '#admin') {
        window.location.hash = 'admin';
      }
    } else {
      if (window.location.hash === '#admin') {
        // Safe replacement without triggering reload
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [view.page]);

  // 2. Fetch Questions (triggered dynamically by search, tag, or sorting filters)
  const fetchQuestions = async (retryCount = 0) => {
    setDataLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (searchVal.trim()) params.append('search', searchVal.trim());
      if (selectedTag) params.append('tag', selectedTag);
      params.append('sort', sortMode);

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) {
        throw new Error('An kasa samo dukkan tambayoyi daga sabar.');
      }
      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      if (err.message === 'Failed to fetch' && retryCount < 5) {
        // Silent automatic retry after 1.5s while the server finishes booting up
        setTimeout(() => {
          fetchQuestions(retryCount + 1);
        }, 1500);
        return;
      }
      const friendlyMsg = err.message === 'Failed to fetch' 
        ? 'An kasa haɗawa da sabar Matambayi. Da fatan a sake gwadawa nan ɗan lokaci.' 
        : err.message;
      setErrorMsg(friendlyMsg);
    } finally {
      setDataLoading(false);
    }
  };

  // 3. Fetch tags and leaders
  const fetchTagsAndLeaders = async (retryCount = 0) => {
    try {
      const [resTags, resLeaders] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/leaders')
      ]);
      if (resTags.ok) setTags(await resTags.json());
      if (resLeaders.ok) setLeaders(await resLeaders.json());
    } catch (err: any) {
      if (err.message === 'Failed to fetch' && retryCount < 5) {
        setTimeout(() => {
          fetchTagsAndLeaders(retryCount + 1);
        }, 1500);
      } else {
        console.warn('Network issue fetching auxiliary details:', err.message);
      }
    }
  };

  // Reload data on view mounts or filter updates
  useEffect(() => {
    if (view.page === 'home') {
      fetchQuestions();
      fetchTagsAndLeaders();
    }
  }, [searchVal, selectedTag, sortMode, view.page]);

  // Auth Success helper
  const handleAuthSuccess = (userData: any) => {
    setCurrentUser(userData);
    localStorage.setItem('matambayi_user', JSON.stringify(userData));
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('matambayi_user');
    setView({ page: 'home' });
  };

  // Question Upvote/Downvote dynamically proxied instantly
  const handleVoteQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!currentUser) {
      setAuthModalTab('login');
      return;
    }
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, direction })
      });
      const data = await res.json();
      if (res.ok) {
        // Update item score list locally instantly
        setQuestions(prev => prev.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              votesCount: data.votesCount,
              upvotes: data.upvotes,
              downvotes: data.downvotes
            };
          }
          return q;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] flex flex-col font-sans selection:bg-orange-150" id="matambayi_root">
      
      {/* Dynamic Header Component */}
      <Header
        currentUser={currentUser}
        onOpenAuth={(tab) => setAuthModalTab(tab)}
        onLogout={handleLogout}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        onNavigate={setView}
        onOpenAskModal={() => {
          if (!currentUser) {
            setAuthModalTab('login');
          } else {
            setShowAskModal(true);
          }
        }}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      {/* Main hero title bar (Only on Home Page) */}
      {view.page === 'home' && (
        <section className="bg-white border-b border-black/5 py-12 px-4 text-center select-none" id="hero_section">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
            <Compass className="h-10 w-10 text-orange-650 animate-pulse mb-1" />
            <h2 className="font-display font-medium text-4xl sm:text-5xl italic tracking-tight text-slate-900">
              Matambayi Ba ya Bata
            </h2>
            <div className="h-[2px] w-12 bg-orange-600 my-1"></div>
            <p className="max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-serif font-medium">
              Sallamar tambaya ita ce makullin sanin kowa. Haɗu da masana fannonin noma, lafiya, tarihin al'ada, da kimiyya domin raba gogewa gami da samun amsoshi amintattu gaba ɗaya cikin harshen Hausa.
            </p>
          </div>
        </section>
      )}

      {/* Responsive Main Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-8" id="main_layout_body">
        
        {/* Dynamic Views routing router */}
        {view.page === 'admin' ? (
          
          /* PAGE D: ADMIN DASHBOARD VIEW */
          <AdminDashboard
            currentUser={currentUser}
            onBack={() => setView({ page: 'home' })}
            onNavigatePage={(view) => setView(view)}
            onLoginSuccess={handleAuthSuccess}
          />

        ) : view.page === 'question' && view.targetId ? (
          
          /* PAGE A: QUESTION DETAILS VIEW */
          <QuestionDetail
            questionId={view.targetId}
            currentUser={currentUser}
            onBack={() => setView({ page: 'home' })}
            onNavigateUser={(user) => setView({ page: 'profile', targetUsername: user })}
          />

        ) : view.page === 'profile' && view.targetUsername ? (
          
          /* PAGE B: USER PROFILE VIEW */
          <UserProfile
            username={view.targetUsername}
            currentUser={currentUser}
            onBack={() => setView({ page: 'home' })}
            onSelectQuestion={(qId) => setView({ page: 'question', targetId: qId })}
            onUpdateCurrentUser={handleAuthSuccess}
          />

        ) : (
          
          /* PAGE C: HOME FEED LIST VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left/Middle: Questions List pane */}
            <div className="lg:col-span-8 flex flex-col gap-6" id="questions_pane">
              
              {/* Filter controls, search tags, sort parameters */}
              <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4.5 w-4.5 text-orange-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                    Tace Tambayoyi
                  </span>
                </div>

                {/* Filter / Sort tabs in Hausa */}
                <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-black/5 w-full sm:w-auto" id="sorting_tabs">
                  <button
                    onClick={() => setSortMode('new')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      sortMode === 'new' 
                        ? 'bg-white text-orange-600 shadow-sm border border-black/5' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Sababbi
                  </button>
                  <button
                    onClick={() => setSortMode('hot')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      sortMode === 'hot' 
                        ? 'bg-white text-orange-600 shadow-sm border border-black/5' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    Mashahura (Hot)
                  </button>
                  <button
                    onClick={() => setSortMode('answers')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      sortMode === 'answers' 
                        ? 'bg-white text-orange-600 shadow-sm border border-black/5' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                    Masu Amsoshi
                  </button>
                </div>
              </div>

              {/* Tag/Search Alerts filter breadcrumb */}
              {(selectedTag || searchVal) && (
                <div className="bg-[#F5F5F0] text-slate-800 px-4 py-3 rounded-xl border border-black/5 flex items-center justify-between text-xs font-bold gap-3 animate-fade-in" id="filter_badge_container">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-orange-650 shrink-0" />
                    <span>
                      Sakamakon binciken 
                      {selectedTag && <> karkashin tag: <span className="underline italic">#{selectedTag}</span></>}
                      {searchVal && <> na Kalmar: <span className="underline italic">"{searchVal}"</span></>}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setSearchVal('');
                    }}
                    className="p-1 px-2.5 font-bold hover:bg-black hover:text-white text-slate-700 bg-white border border-black/5 rounded-lg transition-colors cursor-pointer"
                  >
                    Goge Tace
                  </button>
                </div>
              )}

              {/* Feed Lists state managers */}
              {dataLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm gap-4" id="feed_loading">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-bold">Ana kokarin samo tambayoyi na baya-bayan nan...</p>
                </div>
              ) : errorMsg ? (
                <div className="p-6 bg-red-50 text-red-800 rounded-2xl border border-red-100 text-center text-sm font-semibold flex flex-col items-center gap-2" id="feed_error">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <p>{errorMsg}</p>
                  <button 
                    onClick={fetchQuestions}
                    className="mt-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs"
                  >
                    Sake Gwada
                  </button>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm flex flex-col items-center gap-4" id="feed_empty">
                  <HelpCircle className="h-12 w-12 text-slate-300" />
                  <h3 className="font-display font-bold text-lg text-slate-700">Ba a sami tambaya ko daya ba</h3>
                  <p className="text-sm text-slate-400 leading-normal max-w-sm">
                    Kada ka kasala! Ka iya zama na farko wanda zai kafa tambaya akan wannan fanni a dandalin Matambayi.
                  </p>
                  {currentUser && (
                    <button
                      onClick={() => setShowAskModal(true)}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Yi Tambaya Yanzu
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4" id="questions_loop_list">
                  {questions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      currentUser={currentUser}
                      onVote={handleVoteQuestion}
                      onSelect={(qId) => setView({ page: 'question', targetId: qId })}
                      onTagClick={(tag) => setSelectedTag(tag)}
                    />
                  ))}
                </div>
              )}

            </div>

            {/* Right Panel: Sidebar Component */}
            <div className="lg:col-span-4" id="sidebar_pane">
              <Sidebar
                tags={tags}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                topUsers={leaders}
                onNavigateUser={(user) => setView({ page: 'profile', targetUsername: user })}
              />
            </div>

          </div>
        )}

      </main>



      {/* Modal system: Authentication */}
      {authModalTab && (
        <AuthModal
          initialTab={authModalTab}
          onClose={() => setAuthModalTab(null)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Modal system: Ask Question */}
      {showAskModal && currentUser && (
        <AskQuestionForm
          currentUser={currentUser}
          onClose={() => setShowAskModal(false)}
          onSuccess={(newQuest) => {
            setShowAskModal(false);
            setView({ page: 'question', targetId: newQuest.id });
          }}
        />
      )}

    </div>
  );
}
