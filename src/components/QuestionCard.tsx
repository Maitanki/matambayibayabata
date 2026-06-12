/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { Question, User } from '../types';

interface QuestionCardProps {
  key?: string | number;
  question: Question;
  currentUser: User | null;
  onVote: (questionId: string, direction: 'up' | 'down') => void | Promise<void>;
  onSelect: (questionId: string) => void;
  onTagClick: (tagName: string) => void;
}

export default function QuestionCard({
  question,
  currentUser,
  onVote,
  onSelect,
  onTagClick
}: QuestionCardProps) {
  
  const hasUpvoted = currentUser ? question.upvotes.includes(currentUser.id) : false;
  const hasDownvoted = currentUser ? question.downvotes.includes(currentUser.id) : false;

  // Custom Hausa time ago relative formatting
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

  return (
    <div 
      className="bg-white rounded-2xl border border-black/5 p-6 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative"
      id={`question_card_${question.id}`}
    >
      
      {/* Vote controls (Left on desktop, bottom/top on mobile) */}
      <div className="flex md:flex-col items-center justify-center gap-2 md:gap-1.5 bg-[#F8F7F2] md:py-3.5 md:px-2 rounded-xl shrink-0 h-fit border border-black/5" id={`vote_box_${question.id}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(question.id, 'up');
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            hasUpvoted 
              ? 'text-orange-650 bg-orange-100' 
              : 'text-slate-500 hover:text-orange-655 hover:bg-black/5'
          }`}
          title="Ina son wannan tambaya (Upvote)"
        >
          <ThumbsUp className="h-4 w-4 stroke-[2.5]" />
        </button>
        
        <span className="font-mono font-bold text-sm text-slate-800 tracking-tight" id={`votes_count_${question.id}`}>
          {question.votesCount}
        </span>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote(question.id, 'down');
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            hasDownvoted 
              ? 'text-blue-600 bg-blue-100' 
              : 'text-slate-500 hover:text-blue-600 hover:bg-black/5'
          }`}
          title="Bana son wannan tambaya (Downvote)"
        >
          <ThumbsDown className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Main content body preview */}
      <div className="flex-1 flex flex-col justify-between" id="question_main_preview">
        <div>
          {/* Top Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs mb-2">
            <span className="font-bold text-slate-600 hover:underline cursor-pointer">
              @{question.authorName}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[9px] font-extrabold border border-orange-100">
              ★ {question.authorReputation}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              {getHausaTimeAgo(question.createdAt)}
            </span>

            {question.bestAnswerId && (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 animate-pulse">
                <CheckCircle className="h-3 w-3" />
                Mafi Kyawun Amsa
              </span>
            )}
          </div>

          {/* Title */}
          <h2 
            onClick={() => onSelect(question.id)}
            className="font-serif font-bold text-lg sm:text-xl text-[#1A1A1A] hover:text-orange-655 cursor-pointer transition-colors leading-snug mb-2 hover:underline underline-offset-4 decoration-orange-655"
          >
            {question.title}
          </h2>

          {/* Body excerpt (collapses long text) */}
          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 font-serif">
            {question.body}
          </p>
        </div>

        {/* Footer info: tags & answers count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/5 text-xs text-slate-550">
          <div className="flex flex-wrap gap-1.5">
            {question.tags.map(tag => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
                className="px-2.5 py-1 bg-[#F5F5F0] text-slate-700 hover:bg-black hover:text-white font-bold rounded border border-black/5 cursor-pointer transition-colors text-[10px] uppercase tracking-wider"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] uppercase tracking-wider font-bold transition-all ${
              question.answersCount > 0 
                ? question.bestAnswerId 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold' 
                  : 'bg-orange-50 text-orange-700 border-orange-100 font-bold' 
                : 'text-slate-400 bg-white border-black/5'
            }`}>
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{question.answersCount} Amsoshi</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
