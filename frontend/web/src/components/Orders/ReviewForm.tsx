'use client';

import React, { useState } from 'react';
import { createReview } from '@/lib/api/commerce';

export default function ReviewForm({ orderItemId, productName, onDone, onCancel }: { orderItemId: number; productName: string; onDone: () => void; onCancel: () => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim().length < 2) return setError('Write a short review before submitting.');
    setLoading(true); setError('');
    try {
      await createReview({ orderItemId, rating, text: text.trim(), feedback: feedback.trim() || undefined, image });
      onDone();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Review could not be submitted.');
    } finally { setLoading(false); }
  };

  return <form onSubmit={submit} className="mt-4 rounded-lg border border-gray-3 bg-gray-1 p-4">
    <p className="font-medium text-dark">Review {productName}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Rating">
      {[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`text-2xl ${value <= rating ? 'text-yellow-dark' : 'text-gray-4'}`} aria-label={`${value} star rating`}>★</button>)}
      <span className="text-custom-sm text-dark-4">{rating}/5</span>
    </div>
    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Share your product experience" className="mt-3 w-full rounded-md border border-gray-3 bg-white px-4 py-3 outline-none focus:border-blue" />
    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} placeholder="Additional feedback (optional)" className="mt-3 w-full rounded-md border border-gray-3 bg-white px-4 py-3 outline-none focus:border-blue" />
    <label className="mt-3 block text-custom-sm text-dark-4">Optional image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] || null)} className="mt-2 block w-full text-custom-sm" /></label>
    {error && <p className="mt-3 text-custom-sm text-red">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-3"><button disabled={loading} type="submit" className="rounded-md bg-blue px-5 py-2.5 font-medium text-white hover:bg-blue-dark disabled:opacity-50">{loading ? 'Submitting…' : 'Submit Review'}</button><button type="button" onClick={onCancel} className="rounded-md border border-gray-3 px-5 py-2.5 font-medium text-dark hover:border-blue hover:text-blue">Cancel</button></div>
  </form>;
}
