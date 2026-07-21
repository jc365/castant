import { useState, useEffect, useRef } from 'react';
import client from '../api/client';

interface Submission {
  id: string;
  videoUrl: string;
  actorId: string;
  score: number | null;
  feedback: string | null;
}

interface VideoPlayerModalProps {
  isOpen: boolean;
  submissions: Submission[];
  currentIndex: number;
  isDirector: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onReviewUpdated: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function getVideoType(url: string): 'youtube' | 'vimeo' | 'local' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('vimeo.com')) return 'vimeo';
  return 'local';
}

function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', ogv: 'video/ogg',
    mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
  };
  return mimeMap[ext] || 'video/mp4';
}

function scoreToStars(score: number | null): number {
  if (score === null) return 0;
  return Math.round(score / 2);
}

function starsToScore(stars: number): number {
  return stars * 2;
}

export default function VideoPlayerModal({
  isOpen, submissions, currentIndex, isDirector, onClose, onNavigate, onReviewUpdated,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submission = submissions[currentIndex];
  const hasReview = submission?.score !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!submission) return;
    setScore(scoreToStars(submission.score));
    setFeedback(submission.feedback || '');
    setError('');
    setSuccess('');
  }, [submission]);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [isOpen, currentIndex]);

  if (!isOpen || !submission) return null;

  const type = getVideoType(submission.videoUrl);
  const prev = () => { if (currentIndex > 0) onNavigate(currentIndex - 1); };
  const next = () => { if (currentIndex < submissions.length - 1) onNavigate(currentIndex + 1); };

  const handleSubmitReview = async () => {
    if (score === 0) {
      setError('Please select a score');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await client.patch(`/submissions/${submission.id}/review`, {
        score: starsToScore(score),
        feedback: feedback.trim(),
      });
      setSuccess(hasReview ? 'Review updated!' : 'Review submitted!');
      onReviewUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Video: ${submission.actorId}`}
        className="relative w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous submission"
              className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
            </button>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {currentIndex + 1} of {submissions.length}
            </span>
            <button
              onClick={next}
              disabled={currentIndex === submissions.length - 1}
              aria-label="Next submission"
              className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-title-sm text-title-sm text-on-surface">{submission.actorId}</span>
            <span className={`px-2 py-0.5 rounded font-label-caps text-label-caps ${
              hasReview
                ? 'bg-primary-container/20 text-primary-fixed-dim border border-primary-container/30'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {hasReview ? 'Reviewed' : 'Pending'}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex gap-4">
          {/* Video Container */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
              {type === 'youtube' && (
                <iframe
                  key={submission.id}
                  src={`https://www.youtube.com/embed/${extractYouTubeId(submission.videoUrl)}?autoplay=1&rel=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={`Video: ${submission.actorId}`}
                />
              )}
              {type === 'vimeo' && (
                <iframe
                  key={submission.id}
                  src={`https://player.vimeo.com/video/${extractVimeoId(submission.videoUrl)}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={`Video: ${submission.actorId}`}
                />
              )}
              {type === 'local' && (
                <video
                  key={submission.id}
                  ref={videoRef}
                  controls
                  autoPlay
                  className="absolute inset-0 w-full h-full object-contain"
                >
                  <source src={submission.videoUrl} type={getMimeType(submission.videoUrl)} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>

          {/* Review Panel (director only) */}
          {isDirector && (
            <div className="w-72 flex-shrink-0 bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="font-title-sm text-title-sm text-on-surface">Review</h3>

              {/* Stars */}
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">
                  Score
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setScore(star === score ? 0 : star)}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      className="transition-colors hover:scale-110"
                    >
                      <span className={`material-symbols-outlined text-[28px] ${
                        star <= score ? 'text-primary' : 'text-outline-variant'
                      }`}>
                        {star <= score ? 'star' : 'star_border'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="flex-1">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Optional feedback..."
                  rows={4}
                  className="w-full bg-surface-container border-b-2 border-outline-variant/30 text-on-surface px-3 py-2 rounded focus:outline-none focus:border-primary transition-colors resize-none text-sm"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="bg-error-container text-on-error-container p-2 rounded text-xs">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-primary-container/20 text-primary-fixed-dim p-2 rounded text-xs border border-primary-container/30">
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitReview}
                disabled={loading || score === 0}
                className="w-full py-2.5 bg-primary-container text-on-primary-container font-title-sm text-title-sm rounded hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      {hasReview ? 'edit' : 'rate_review'}
                    </span>
                    {hasReview ? 'Update Review' : 'Submit Review'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
