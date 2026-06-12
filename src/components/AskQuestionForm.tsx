/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, Tag, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { User } from '../types';

interface AskQuestionFormProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (newQuestion: any) => void;
}

export default function AskQuestionForm({ currentUser, onClose, onSuccess }: AskQuestionFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Suggestions of common Hausa tags
  const suggestedTags = ['Noma', 'Lafiya', 'Arziki', 'Tarihi', 'Kimiyya', 'Al`ada', 'Ilimi', 'Kano', 'Zaria', 'Katsina'];

  const handleAddSuggestedTag = (tag: string) => {
    const currentTags = tagInput.trim().split(/[\s,]+/).filter(t => t.length > 0);
    if (currentTags.some(t => t.toLowerCase() === tag.toLowerCase())) return;
    
    if (tagInput.trim() === '') {
      setTagInput(tag);
    } else {
      setTagInput(prev => `${prev.trim()} ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Dole ne ku shigar da take (title) da kuma cikakken bayani na tambayarku.');
      return;
    }

    if (title.trim().length < 10) {
      setErrorMsg('Don Allah take na tambaya ya kasance akalla haruffa 10.');
      return;
    }

    if (body.trim().length < 30) {
      setErrorMsg('Don Allah cikakken bayani ya zama mai tsawo akalla sassan haruffa 30 domin sauran su fahimta.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Normalize tags to space-separated array
    const tags = tagInput
      .replace(/,/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0 && t.length < 20);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          tags,
          userId: currentUser.id
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gaza wallafa tambaya.');
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto" id="ask_backdrop">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-black/5 overflow-hidden my-8 animate-fade-in" id="ask_container">
        
        {/* Header decor */}
        <div className="bg-[#F8F7F2] px-8 py-6 flex items-center gap-3 border-b border-black/5">
          <div className="bg-orange-50 p-2 rounded-xl border border-orange-100">
            <HelpCircle className="h-5 w-5 text-orange-655" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">Wallafa Sabuwar Tambaya</h2>
            <p className="text-xs text-slate-500 font-medium">Raba tambayarka ga dandalin Matambayi domin bayar da amsoshi masu amfani.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3.5 bg-orange-50 text-orange-800 text-xs font-bold rounded-xl border border-orange-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Taken Tambaya (Title)</span>
              <span className="text-orange-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Menene tambayarka ko matsalar da kake son bayani a kai?"
              className="block w-full px-4 py-3 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650 focus:bg-white text-slate-800 font-serif transition-all"
            />
            <p className="mt-1 text-[11px] text-slate-450">Kasance mai takaitawa da fayyace tambayar ku yadda zai ja hankali.</p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Cikakken Bayani (Question Details)</span>
              <span className="text-orange-600">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Anan zaka iya shigar da duk wani cikakken bayani, haduwar matsalolin da kake fuskanta, ko abubuwan da ka riga kayi kokarin gwadawa..."
              className="block w-full px-4 py-3 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650 focus:bg-white text-slate-800 leading-relaxed font-serif transition-all"
            />
            <p className="mt-1 text-[11px] text-slate-450 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span>Tsara daidai: Bayar da cikakken bayani na a kalla haruffa 30.</span>
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>Mabuɗan Kalmomi (Tags)</span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Raba tags ta hanyar amfani da sarari (space), misali: Noma Kwari Kano"
              className="block w-full px-4 py-3 border border-black/5 rounded bg-[#F5F5F0] placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-orange-650 focus:bg-white text-slate-800 transition-all font-medium"
            />
            
            {/* Suggested Tags selection UI */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1 shrink-0 mr-1 select-none">
                <Sparkles className="h-3 w-3 text-orange-500" /> Suggestions:
              </span>
              {suggestedTags.map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleAddSuggestedTag(tag)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-[#F5F5F0] border border-black/5 hover:bg-black hover:text-white text-slate-750 rounded transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
            
            <p className="mt-1.5 text-[11px] text-slate-450 select-none">Kara tags don saukaka wa jama'a neman tambayarka.</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-black/5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-black/5 text-slate-700 hover:bg-black hover:text-white text-xs font-extrabold rounded-full transition-all cursor-pointer uppercase tracking-wider"
            >
              Soke
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-orange-655 text-white text-xs font-bold rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              {loading ? 'Ana nan wallafawa...' : 'Wallafa Tambaya'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
