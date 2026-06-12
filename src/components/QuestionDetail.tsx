/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, ThumbsDown, MessageSquare, Clock, ArrowLeft, 
  Trash2, CheckCircle, PlusCircle, AlertCircle, ShieldAlert,
  Share2
} from 'lucide-react';
import { Question, Answer, Comment, User, UserRole } from '../types';

interface QuestionDetailProps {
  questionId: string;
  currentUser: User | null;
  onBack: () => void;
  onNavigateUser: (username: string) => void;
}

export default function QuestionDetail({
  questionId,
  currentUser,
  onBack,
  onNavigateUser
}: QuestionDetailProps) {
  const [data, setData] = useState<{
    id: string;
    title: string;
    body: string;
    tags: string[];
    authorId: string;
    authorName: string;
    authorReputation: number;
    upvotes: string[];
    downvotes: string[];
    votesCount: number;
    bestAnswerId?: string;
    createdAt: string;
    comments: Comment[];
    answers: (Answer & { comments: Comment[] })[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Input fields state
  const [answerBody, setAnswerBody] = useState('');
  const [questionComment, setQuestionComment] = useState('');
  const [activeAnsCommentId, setActiveAnsCommentId] = useState<string | null>(null);
  const [ansCommentBody, setAnsCommentBody] = useState('');

  // Sharing feedback states
  const [shareFeedback, setShareFeedback] = useState<{ id: string; type: 'question' | 'answer'; msg: string } | null>(null);

  // Submit trackers
  const [submitLoading, setSubmitLoading] = useState(false);

  // Share handler
  const handleShare = async (type: 'question' | 'answer', id: string, answerText?: string) => {
    if (!data) return;
    const questionLink = `${window.location.origin}/?q=${data.id}`;
    const targetLink = type === 'answer' ? `${questionLink}#ans-${id}` : questionLink;
    
    let text = '';
    if (type === 'question') {
      text = `Tambaya daga Matambayi 👑 (Dandalin Amshi da Tambaya a kasar Hausa):
"${data.title}"

Karanta ko ka bada taka amsa a nan:
🔗 ${targetLink}`;
    } else {
      const truncatedAns = answerText && answerText.length > 80 ? `${answerText.slice(0, 80)}...` : answerText;
      text = `Amsa mai ma'ana daga masanin dandalin Matambayi 💡:
"${truncatedAns}"

Akan tambayar: "${data.title}"
🔗 Duba cikakken bayani a nan:
${targetLink}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Matambayi Raba Ilimi',
          text: text,
          url: targetLink
        });
        return;
      } catch (err) {
        console.log('Share canceled or not supported by browser frame', err);
      }
    }

    // Fallback info: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setShareFeedback({ id, type, msg: 'An kwafi rubutun rabawa lafiya!' });
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      // Manual copy approach
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setShareFeedback({ id, type, msg: 'An kwafi rubutun rabawa!' });
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // Fetch question detail
  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/questions/${questionId}`);
      if (!res.ok) {
        throw new Error('An kasa samo cikakken bayani na wannan tambayar.');
      }
      const raw = await res.json();
      setData(raw);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [questionId]);

  // Vote Question
  const handleVoteQuestion = async (direction: 'up' | 'down') => {
    if (!currentUser) {
      alert('Ka taimaka ka luba ko kayi rajista don kada maki!');
      return;
    }
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, direction })
      });
      const updated = await res.json();
      if (res.ok && data) {
        setData({
          ...data,
          votesCount: updated.votesCount,
          upvotes: updated.upvotes,
          downvotes: updated.downvotes
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Vote Answer
  const handleVoteAnswer = async (answerId: string, direction: 'up' | 'down') => {
    if (!currentUser) {
      alert('Ka taimaka ka luba ko kayi rajista don kada maki!');
      return;
    }
    try {
      const res = await fetch(`/api/questions/${questionId}/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, direction })
      });
      const updated = await res.json();
      if (res.ok && data) {
        const updatedAnswers = data.answers.map(ans => {
          if (ans.id === answerId) {
            return {
              ...ans,
              votesCount: updated.votesCount,
              upvotes: updated.upvotes,
              downvotes: updated.downvotes
            };
          }
          return ans;
        });
        setData({
          ...data,
          answers: updatedAnswers
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Accept Best Answer
  const handleAcceptBestAnswer = async (answerId: string) => {
    if (!currentUser || !data) return;
    try {
      const res = await fetch(`/api/questions/${questionId}/answers/${answerId}/best`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        // Refresh local state content
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Answer
  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Dole ka luba dandalin don kaddamar da amsoshin ka.');
      return;
    }
    if (!answerBody.trim()) {
      alert('Amsar rubutu ba zai zama fayil maras kowa ba.');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: answerBody, userId: currentUser.id })
      });
      if (res.ok) {
        setAnswerBody('');
        fetchDetail();
      } else {
        const err = await res.json();
        alert(err.error || 'Akwai bukata na siffanta can canji.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Comment on Question
  const handlePostQuestionComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !questionComment.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: questionId,
          parentType: 'question',
          body: questionComment,
          userId: currentUser.id
        })
      });
      if (res.ok) {
        setQuestionComment('');
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comment on Answer
  const handlePostAnswerComment = async (answerId: string) => {
    if (!currentUser || !ansCommentBody.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: answerId,
          parentType: 'answer',
          body: ansCommentBody,
          userId: currentUser.id
        })
      });
      if (res.ok) {
        setAnsCommentBody('');
        setActiveAnsCommentId(null);
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin / Author Delete Question
  const handleDeleteQuestion = async () => {
    if (!currentUser || !data) return;
    const confirmText = currentUser.role === UserRole.ADMIN 
      ? 'Shin da gaske kake son goge wannan tambayar baki daya karkashin ikon Admin?'
      : 'Shin kana so ka goge tambayarka daga dandalin Matambayi?';

    if (!window.confirm(confirmText)) return;

    try {
      const endpoint = currentUser.role === UserRole.ADMIN
        ? `/api/admin/questions/${questionId}`
        : `/api/questions/${questionId}`;

      const payload = currentUser.role === UserRole.ADMIN
        ? { adminId: currentUser.id }
        : { userId: currentUser.id };

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('An yi nasarar goge wannan tambaya.');
        onBack();
      } else {
        const err = await res.json();
        alert(err.error || 'Matsalar gogewa.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin / Author Delete Answer
  const handleDeleteAnswer = async (answerId: string) => {
    if (!currentUser) return;
    const confirmText = currentUser.role === UserRole.ADMIN
      ? 'Shin kana son goge wannan amsar saboda batanci ko kuskure?'
      : 'Shin da gaske kake so ka goge amsar ka?';

    if (!window.confirm(confirmText)) return;

    try {
      // In this version we simplify and let admin delete answers
      if (currentUser.role !== UserRole.ADMIN) {
        alert('Gafara dai, admin ne kadai ke da ikon goge amsar kowa a halin yanzu.');
        return;
      }

      const res = await fetch(`/api/admin/answers/${answerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });

      if (res.ok) {
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) return;
    if (!window.confirm('Shin kana so ka goge wannan ra`ayi/comment a matsayin Admin?')) return;

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      if (res.ok) {
        fetchDetail();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Relative Time Hausa
  function getHausaTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'Yanzu-yanzu';
    } else if (diffMin < 60) {
      return `Minti ${diffMin} da suka wuce`;
    } else if (diffHour < 24) {
      return `Sa'o'i ${diffHour} da suka wuce`;
    } else {
      return `Kwana ${diffDay} da suka wuce`;
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-black/5 shadow-sm" id="detail_loading">
        <div className="w-10 h-10 border-4 border-orange-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ana kokarin samo bayanan tambaya...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8 bg-orange-50 text-slate-800 rounded-2xl border border-black/5 flex flex-col items-center gap-4 text-center" id="detail_error">
        <AlertCircle className="h-10 w-10 text-orange-600" />
        <h3 className="font-serif font-bold text-lg">Ba a sami bayanai ba</h3>
        <p className="text-sm font-medium">{errorMsg || 'Kuskure ya faru lokacin loda dukkan tambayoyi.'}</p>
        <button 
          onClick={onBack}
          className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-orange-650 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
        >
          Koma Shafin Farko
        </button>
      </div>
    );
  }

  const isQuestionAuthor = currentUser?.id === data.authorId;

  return (
    <div className="flex flex-col gap-6 animate-fade-in" id={`question_detail_page_${data.id}`}>
      
      {/* 1. Header Navigation Back */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-black hover:text-white border border-black/5 text-slate-700 text-xs font-bold rounded-full shadow-sm transition-all w-fit cursor-pointer uppercase tracking-wider"
        id="detail_back_btn"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Koma Baya</span>
      </button>

      {/* 2. Main Question Card */}
      <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
        
        {/* Title display */}
        <h1 className="font-serif font-semibold text-2xl sm:text-3xl text-slate-900 leading-tight mb-4" id="detail_title">
          {data.title}
        </h1>

        {/* Author metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-black/5 mb-5 text-xs text-slate-500 select-none">
          <div className="flex items-center gap-2.5 font-medium">
            <span 
              onClick={() => onNavigateUser(data.authorName)}
              className="text-xs font-bold text-slate-800 hover:underline cursor-pointer"
            >
              @{data.authorName}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[10px] font-extrabold border border-orange-100">
              ★ {data.authorReputation}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-500 font-medium font-sans">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {getHausaTimeAgo(data.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Delete buttons for author or admin */}
            {(isQuestionAuthor || currentUser?.role === UserRole.ADMIN) && (
              <button
                onClick={handleDeleteQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-red-650 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                title="Goge wannan tambaya"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Goge Tambaya</span>
              </button>
            )}
            
            {currentUser?.role === UserRole.ADMIN && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[9px] font-bold uppercase tracking-wider border border-purple-150">
                <ShieldAlert className="h-3.5 w-3.5" />
                Kariyar Admin
              </span>
            )}
          </div>
        </div>

        {/* Question Body details */}
        <p className="text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-6 font-serif" id="detail_body">
          {data.body}
        </p>

        {/* Question Footer (Tags, Vote score) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/5 select-none">
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-[#F5F5F0] text-slate-800 border border-black/5 text-[10px] uppercase font-bold tracking-wider rounded"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Question Upvote/Downvote actions and Share */}
          <div className="flex flex-wrap items-center gap-3">
            {shareFeedback && shareFeedback.id === 'question' && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-250 px-3 py-1.5 rounded-full font-bold animate-pulse" id="question_share_toast">
                ✓ {shareFeedback.msg}
              </span>
            )}
            
            <button
              onClick={() => handleShare('question', 'question')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-655 text-slate-700 text-xs font-bold rounded-xl border border-black/5 hover:border-orange-200 cursor-pointer transition-all"
              id="share_question_btn"
              title="Raba wannan tambayar"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Raba Tambaya</span>
            </button>

            <div className="flex items-center gap-2 bg-[#F8F7F2] p-1 rounded-xl border border-black/5">
              <button
                onClick={() => handleVoteQuestion('up')}
                className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer ${
                  currentUser && data.upvotes.includes(currentUser.id) ? 'text-orange-650 bg-orange-100 font-bold' : 'text-slate-500'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-800 px-1">{data.votesCount} maki</span>
              <button
                onClick={() => handleVoteQuestion('down')}
                className={`p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer ${
                  currentUser && data.downvotes.includes(currentUser.id) ? 'text-blue-600 bg-blue-100 font-bold' : 'text-slate-500'
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2a. Question Comments (Ra`ayoyi) */}
        <div className="mt-8 pt-6 border-t border-black/5" id="question_comments_area">
          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] mb-4 flex items-center gap-1.5">
            Maganar Ra'ayi akan Tambaya ({data.comments.length})
          </h4>

          <div className="flex flex-col gap-3 mb-5 shrink-0" id="question_comments_list">
            {data.comments.map(c => (
              <div key={c.id} className="text-xs bg-[#F8F7F2]/40 hover:bg-[#F8F7F2] p-3 rounded-xl border border-black/5 flex items-start justify-between gap-3">
                <div className="leading-relaxed font-serif">
                  <span 
                    onClick={() => onNavigateUser(c.authorName)}
                    className="font-bold text-slate-800 hover:underline hover:text-orange-655 cursor-pointer font-sans text-xs shrink-0 mr-1.5"
                  >
                    @{c.authorName}
                  </span>: <span className="text-slate-700">{c.body}</span>
                  <span className="text-slate-400 font-sans text-[10px] font-normal ml-2">({getHausaTimeAgo(c.createdAt)})</span>
                </div>
                {currentUser?.role === UserRole.ADMIN && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded"
                    title="Goge maki ta matsayin admin"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* New comment input */}
          {currentUser ? (
            <form onSubmit={handlePostQuestionComment} className="flex gap-2">
              <input
                type="text"
                value={questionComment}
                onChange={(e) => setQuestionComment(e.target.value)}
                placeholder="Rubuta ra'ayinka akan wannan tambayar a gajarce..."
                className="flex-1 px-4 py-2.5 border border-black/5 rounded-full bg-[#F5F5F0] placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-orange-650"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Tura
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-400 italic font-medium">Dole ka luba dandalin don yin ra'ayi.</p>
          )}
        </div>

      </div>

      {/* 3. Answers Section (Amsoshi) */}
      <div className="mt-4" id="answers_section_anchor">
        <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-930 mb-5 flex items-center justify-between gap-2 border-b border-black/5 pb-3">
          <span>{data.answers.length} Amsoshi</span>
          {data.bestAnswerId && (
            <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
              Mafi kyawun amsa a nan!
            </span>
          )}
        </h2>

        <div className="flex flex-col gap-6" id="answers_list">
          {data.answers.map(ans => {
            const isBestSolution = ans.id === data.bestAnswerId;
            const hasUpvotedAns = currentUser ? ans.upvotes.includes(currentUser.id) : false;
            const hasDownvotedAns = currentUser ? ans.downvotes.includes(currentUser.id) : false;

            return (
              <div 
                key={ans.id} 
                className={`rounded-3xl border p-6 transition-all shadow-sm relative ${
                  isBestSolution 
                    ? 'bg-emerald-50/20 border-emerald-300 shadow-md ring-1 ring-emerald-100/50' 
                    : 'bg-white border-black/5'
                }`}
                id={`answer_node_${ans.id}`}
              >
                {/* Best Answer Header Star Badge */}
                {isBestSolution && (
                  <div className="sm:absolute top-5 right-6 bg-emerald-600 text-white px-3.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold inline-flex items-center gap-1 shadow-sm mb-3 sm:mb-0 select-none">
                    <CheckCircle className="h-3 w-3 stroke-[2.5]" />
                    <span>Mafi Kyawun Amsa</span>
                  </div>
                )}

                {/* Answer Author Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mb-4 select-none">
                  <div className="flex items-center gap-2 font-medium">
                    <span 
                      onClick={() => onNavigateUser(ans.authorName)}
                      className="font-bold text-slate-800 hover:underline cursor-pointer font-sans"
                    >
                      @{ans.authorName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[9px] font-extrabold border border-orange-100">
                      ★ {ans.authorReputation}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 font-sans text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {getHausaTimeAgo(ans.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Choose as best answer button (only for question author, but only if not already best) */}
                    {isQuestionAuthor && !ans.isBest && (
                      <button
                        onClick={() => handleAcceptBestAnswer(ans.id)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-full shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                        title="Zaba matsayin mafi kyawun amsa"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Mafi Kyawun Amsa</span>
                      </button>
                    )}

                    {/* Admin delete for answers */}
                    {currentUser?.role === UserRole.ADMIN && (
                      <button
                        onClick={() => handleDeleteAnswer(ans.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Goge wannan amsa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer body text */}
                <p className="text-slate-800 text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap mb-5 font-serif" id={`answer_text_${ans.id}`}>
                  {ans.body}
                </p>

                {/* Answer Voting Score actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/5 select-none font-sans">
                  <div className="flex items-center gap-2 bg-[#F8F7F2] p-1 rounded-lg border border-black/5">
                    <button
                      onClick={() => handleVoteAnswer(ans.id, 'up')}
                      className={`p-1.5 hover:bg-black/5 rounded-md transition-colors cursor-pointer ${
                        hasUpvotedAns ? 'text-orange-655 bg-orange-50 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-850 px-1">{ans.votesCount}</span>
                    <button
                      onClick={() => handleVoteAnswer(ans.id, 'down')}
                      className={`p-1.5 hover:bg-black/5 rounded-md transition-colors cursor-pointer ${
                        hasDownvotedAns ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {shareFeedback && shareFeedback.id === ans.id && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-bold animate-pulse">
                        ✓ {shareFeedback.msg}
                      </span>
                    )}
                    <button
                      onClick={() => handleShare('answer', ans.id, ans.body)}
                      className="text-xs font-bold text-slate-500 hover:text-orange-655 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider transition-colors"
                      id={`share_answer_btn_${ans.id}`}
                      title="Raba wannan amsa"
                    >
                      <Share2 className="h-3.5 w-3.5 opacity-70" />
                      <span>Raba Amsa</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentUser) return alert('Dole ku luba kafin ku yi ra`ayi.');
                        setActiveAnsCommentId(activeAnsCommentId === ans.id ? null : ans.id);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-orange-655 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <MessageSquare className="h-3.5 w-3.5 opacity-70" />
                      <span>Ra'ayoyi ({ans.comments ? ans.comments.length : 0})</span>
                    </button>
                  </div>
                </div>

                {/* Answer comments */}
                <div className="mt-4 pt-4 border-t border-black/5 pl-4 bg-[#F8F7F2]/40 rounded-xl" id={`answer_comments_area_${ans.id}`}>
                  {ans.comments && ans.comments.map(ac => (
                    <div key={ac.id} className="text-xs p-2 border-b border-black/5 flex items-center justify-between group">
                      <div className="font-serif">
                        <span 
                          onClick={() => onNavigateUser(ac.authorName)}
                          className="font-bold text-slate-700 hover:underline cursor-pointer font-sans text-xs shrink-0 mr-1 pb-1"
                        >
                          @{ac.authorName}
                        </span>: <span className="text-slate-750">{ac.body}</span>
                        <span className="text-[10px] text-slate-400 font-sans ml-2 font-normal">({getHausaTimeAgo(ac.createdAt)})</span>
                      </div>
                      {currentUser?.role === UserRole.ADMIN && (
                        <button
                          onClick={() => handleDeleteComment(ac.id)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                          title="Goge maki na admin"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Comment on Answer input */}
                  {activeAnsCommentId === ans.id && (
                    <div className="mt-3 flex gap-2 animate-fade-in">
                      <input
                        type="text"
                        value={ansCommentBody}
                        onChange={(e) => setAnsCommentBody(e.target.value)}
                        placeholder="Nuna goyon baya ko gyara akan amsar nan..."
                        className="flex-1 px-3 py-1.5 border border-black/5 bg-white text-slate-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-650 font-medium"
                      />
                      <button
                        onClick={() => handlePostAnswerComment(ans.id)}
                        className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-orange-655 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Tura
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {data.answers.length === 0 && (
            <div className="p-12 bg-white rounded-3xl border border-black/5 text-center shadow-sm">
              <p className="text-sm text-slate-400 italic leading-relaxed max-w-sm mx-auto">Babu amsa ko daya akan wannan tambayar tukunna. Zama farkon wanda zai fara bayar da haske!</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Write Your Answer space (Amsa Tambaya) */}
      <div className="bg-white rounded-3xl border border-black/5 p-6 shadow-sm mt-2">
        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A] mb-4 flex items-center gap-1.5">
          <PlusCircle className="h-4.5 w-4.5 text-orange-655" />
          Taimaka da Amsar ku (Submit Solution)
        </h4>

        {currentUser ? (
          <form onSubmit={handlePostAnswer} className="flex flex-col gap-4">
            <textarea
              required
              rows={5}
              value={answerBody}
              onChange={(e) => setAnswerBody(e.target.value)}
              placeholder="Shigar da sani ko shawarwari daka sani don taimaka musu. Tabbatar da gaskiya mai dorewa..."
              className="block w-full px-4 py-3 border border-black/5 rounded-xl bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650 focus:bg-white text-slate-800 leading-relaxed font-serif"
            />
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full sm:w-fit px-6 py-2.5 bg-[#1A1A1A] hover:bg-orange-650 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 self-end cursor-pointer uppercase tracking-wider"
            >
              {submitLoading ? 'Ana tura amsar...' : 'Tura Amsa (Submit)'}
            </button>
          </form>
        ) : (
          <div className="p-6 bg-[#F8F7F2] rounded-2xl border border-dashed border-black/5 text-center">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
              Kada ka bari iliminka ya tafi a banzar rubutu! Da fatan ka shiga dandalin ko kayi rajista don bayar da amsoshi.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
