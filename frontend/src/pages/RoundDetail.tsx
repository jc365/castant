import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';
import { useUserCache } from '../context/UserCacheContext';
import { useToast } from '../context/ToastContext';
import SubmitVideoModal from '../components/SubmitVideoModal';
import VideoPlayerModal from '../components/VideoPlayerModal';
import CreateNextRoundModal from '../components/CreateNextRoundModal';
import AddParticipantsModal from '../components/AddParticipantsModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getStatusStyle, type SubmissionStatus } from '../utils/submissionStatus';

interface Participant {
  id: string;
  role: string;
  email: string | null;
  name: string | null;
}

interface Submission {
  id: string;
  videoUrl: string;
  actorId: string;
  duration: number | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
}

interface Round {
  id: string;
  number: number;
  castingId: string;
  participants: Participant[];
  submissions: Submission[];
}

export default function RoundDetail() {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { getRoleInRound, isDirectorOf, isActorOf, isPreselectorOf } = useUser();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCreateNextRound, setShowCreateNextRound] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditRound, setShowEditRound] = useState(false);
  const [showDeleteSubmission, setShowDeleteSubmission] = useState<string | null>(null);
  const [castingTitle, setCastingTitle] = useState('');

  const { showSuccess, showError } = useToast();
  const { getUser, ensureUser } = useUserCache();
  const role = roundId ? getRoleInRound(roundId) : null;
  const isDirector = round ? isDirectorOf(round.castingId) : false;
  const isActor = roundId ? isActorOf(roundId) : false;
  const isPreselector = roundId ? isPreselectorOf(roundId) : false;

  useEffect(() => {
    if (!roundId) return;
    client.get(`/rounds/${roundId}`)
      .then((res) => {
        const data = res.data;
        data.participants = data.participants.map((p: { actorId: string; role: string; email: string | null; name: string | null }) => ({
          id: p.actorId,
          role: p.role,
          email: p.email,
          name: p.name,
        }));
        setRound(data);
        return client.get(`/castings/${data.castingId}`);
      })
      .then((res) => {
        if (res) setCastingTitle(res.data.title);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roundId]);

  useEffect(() => {
    if (!round) return;
    round.participants.forEach((p) => {
      ensureUser(p.id);
    });
  }, [round, ensureUser]);

  const handleDeleteRound = async () => {
    if (!round) return;
    try {
      await client.delete(`/rounds/${round.id}`);
      showSuccess('Round deleted');
      navigate(`/castings/${round.castingId}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete round');
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    try {
      await client.delete(`/submissions/${submissionId}`);
      showSuccess('Submission deleted');
      setShowDeleteSubmission(null);
      client.get(`/rounds/${roundId}`).then((res) => {
        const data = res.data;
        data.participants = data.participants.map((p: { actorId: string; role: string; email: string | null; name: string | null }) => ({
          id: p.actorId, role: p.role, email: p.email, name: p.name,
        }));
        setRound(data);
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete submission');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading round...
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-xl">
        Error: {error || 'Round not found'}
      </div>
    );
  }

  const actors = round.participants.filter((p) => p.role === 'actor');
  const preselectors = round.participants.filter((p) => p.role === 'preselector');

  return (
    <div className="flex gap-6 min-h-[calc(100vh-8rem)]">
      {/* Center: Video Grid */}
      <div className="flex-1">
        <div className="mb-8">
          <Link to={`/castings/${round.castingId}`} className="text-primary hover:text-primary-fixed-dim transition-colors font-body-sm text-body-sm flex items-center gap-1 mb-4">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Casting
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-display-lg text-display-lg text-on-background">
                Round {round.number}{castingTitle && ` — ${castingTitle}`}
              </h1>
              <p className="text-on-surface-variant mt-1 font-body-lg text-body-lg">
                {round.submissions.length} submission{round.submissions.length !== 1 ? 's' : ''} received
              </p>
            </div>
            <div className="flex gap-3">
              {isActor && (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-primary-container text-on-primary-container font-title-sm text-title-sm py-2 px-4 rounded hover:bg-primary transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Submit Video
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Grid */}
        {round.submissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {round.submissions.map((s, idx) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                isDirector={isDirector}
                isPreselector={isPreselector}
                onPlay={() => setSelectedVideoIndex(idx)}
                onDelete={() => setShowDeleteSubmission(s.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface border border-outline-variant/30 rounded-xl">
            <span className="material-symbols-outlined text-6xl text-outline mb-4 block">videocam_off</span>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              No submissions yet.
            </p>
          </div>
        )}
      </div>

      {/* Right Sidebar: Round Management */}
      <div className="w-80 flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant/30 flex flex-col h-[calc(100vh-8rem)] sticky top-16">
        {/* Sticky Actions - always visible */}
        {isDirector && (
          <div className="flex-shrink-0 border-b border-outline-variant/20 p-4 flex flex-col gap-2">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Actions</h4>
            <button
              onClick={() => setShowAddParticipants(true)}
              className="w-full py-2 border border-outline-variant/50 text-on-surface-variant font-label-caps text-label-caps rounded hover:bg-surface-container hover:text-on-surface transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Add Participants
            </button>
            <button
              onClick={() => setShowCreateNextRound(true)}
              className="w-full py-2 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/80 transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Create Next Round
            </button>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowEditRound(true)}
                className="flex-1 py-1.5 border border-outline-variant/50 text-on-surface-variant font-label-caps text-label-caps rounded hover:bg-surface-container transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-1.5 border border-error/30 text-error font-label-caps text-label-caps rounded hover:bg-error-container/20 transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 flex flex-col gap-8">
          {/* Round Details */}
          <section>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Round Management</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Status</span>
                <span className="bg-primary-container/20 text-primary-fixed-dim px-2 py-1 rounded font-label-caps text-label-caps border border-primary-container/30">
                  IN PROGRESS
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Total Submissions</span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {round.submissions.length}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/20">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Round</span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  {round.number}
                </span>
              </div>
            </div>
          </section>

          {/* Role Badge */}
          {role && (
            <section>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 w-full justify-center">
                <span className="font-label-caps text-label-caps text-primary uppercase">
                  Your role: {role}
                </span>
              </span>
            </section>
          )}

          {/* Pre-Selectors */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-title-sm text-title-sm text-on-surface">Pre-Selectors</h4>
              {isDirector && (
                <button className="text-primary hover:text-primary-fixed transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>
              )}
            </div>
            {preselectors.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {preselectors.map((p) => {
                  const hasReviewed = round.submissions.some((s) => s.score !== null);
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container border border-outline-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-body-sm text-body-sm text-on-surface leading-tight truncate">{getUser(p.id)?.name || p.id}</p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant truncate">{getUser(p.id)?.email || p.email}</p>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[16px] ${hasReviewed ? 'text-primary' : 'text-outline-variant'}`}
                        title={hasReviewed ? 'Reviewed' : 'Pending'}
                      >
                        {hasReviewed ? 'check_circle' : 'pending'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-on-surface-variant text-sm">No pre-selectors assigned.</p>
            )}
          </section>

          {/* Actors List */}
          <section className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-title-sm text-title-sm text-on-surface">Actors</h4>
              <span className="font-label-caps text-label-caps text-on-surface-variant">{actors.length} Total</span>
            </div>
            {actors.length > 0 ? (
              <ul className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2">
                {actors.map((a) => {
                  const submitted = round.submissions.some((s) => s.actorId === a.id);
                  const passed = round.submissions.some((s) => s.actorId === a.id && s.score !== null && s.score < 5);
                  return (
                    <li key={a.id} className={`flex items-center gap-3 ${passed ? 'opacity-50' : ''}`}>
                      <div className="w-8 h-8 rounded bg-surface-container border border-outline-variant flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body-sm text-body-sm text-on-surface leading-tight truncate">{getUser(a.id)?.name || a.name || a.id}</p>
                        <p className="font-label-caps text-label-caps text-on-surface-variant truncate">{getUser(a.id)?.email || a.email}</p>
                      </div>
                      {passed ? (
                        <span className="material-symbols-outlined text-[16px] text-error flex-shrink-0" title="Passed">close</span>
                      ) : submitted ? (
                        <span className="material-symbols-outlined text-[16px] text-primary flex-shrink-0" title="Submitted">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-outline-variant flex-shrink-0" title="Pending">pending</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-on-surface-variant text-sm">No actors assigned.</p>
            )}
          </section>
        </div>
      </div>

      <SubmitVideoModal
        roundId={round.id}
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          setShowSubmitModal(false);
          window.location.reload();
        }}
      />

      <VideoPlayerModal
        isOpen={selectedVideoIndex !== null}
        submissions={round.submissions}
        currentIndex={selectedVideoIndex ?? 0}
        isDirector={isDirector}
        onClose={() => setSelectedVideoIndex(null)}
        onNavigate={(idx) => setSelectedVideoIndex(idx)}
        onReviewUpdated={() => {
          client.get(`/rounds/${roundId}`).then((res) => {
            const data = res.data;
            data.participants = data.participants.map((p: { actorId: string; role: string; email: string | null; name: string | null }) => ({
              id: p.actorId, role: p.role, email: p.email, name: p.name,
            }));
            setRound(data);
          });
        }}
      />

      <CreateNextRoundModal
        isOpen={showCreateNextRound}
        roundId={round.id}
        submissions={round.submissions}
        participants={round.participants}
        onClose={() => setShowCreateNextRound(false)}
        onCreated={(newRoundId) => navigate(`/rounds/${newRoundId}`)}
      />

      <AddParticipantsModal
        isOpen={showAddParticipants}
        roundNumber={round.number}
        roundId={round.id}
        onClose={() => setShowAddParticipants(false)}
        onAdded={() => {
          client.get(`/rounds/${roundId}`).then((res) => {
            const data = res.data;
            data.participants = data.participants.map((p: { actorId: string; role: string; email: string | null; name: string | null }) => ({
              id: p.actorId, role: p.role, email: p.email, name: p.name,
            }));
            setRound(data);
          });
        }}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Round"
        message={`Are you sure you want to delete Round ${round.number}? This will permanently delete all submissions.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteRound}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showDeleteSubmission !== null}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => showDeleteSubmission && handleDeleteSubmission(showDeleteSubmission)}
        onCancel={() => setShowDeleteSubmission(null)}
      />

      {showEditRound && (
        <EditRoundModal
          round={round}
          onClose={() => setShowEditRound(false)}
          onSaved={() => {
            setShowEditRound(false);
            client.get(`/rounds/${roundId}`).then((res) => setRound(res.data));
            showSuccess('Round updated');
          }}
        />
      )}
    </div>
  );
}

function SubmissionCard({
  submission,
  isDirector,
  isPreselector,
  onPlay,
  onDelete,
}: {
  submission: Submission;
  isDirector: boolean;
  isPreselector: boolean;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const { getUser, ensureUser } = useUserCache();
  const actor = getUser(submission.actorId);
  const hasScore = submission.score !== null;
  const statusStyle = getStatusStyle(submission.status);

  useEffect(() => {
    ensureUser(submission.actorId);
  }, [submission.actorId, ensureUser]);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors duration-300">
      {/* Video Thumbnail Placeholder */}
      <div
        onClick={onPlay}
        className="relative w-full aspect-video bg-surface-container-highest overflow-hidden cursor-pointer"
      >
        <div className="w-full h-full flex items-center justify-center bg-surface-container">
          <span className="material-symbols-outlined text-on-surface-variant text-4xl">play_circle</span>
        </div>
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[24px]">play_arrow</span>
          </div>
        </div>
        {/* Status Chip */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded font-label-caps text-label-caps backdrop-blur-sm ${statusStyle.chipClass}`}>
          {statusStyle.label}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-title-sm text-title-sm text-on-surface truncate">{actor?.name || submission.actorId}</h3>
            {actor?.email && (
              <p className="font-label-caps text-label-caps text-on-surface-variant truncate">{actor.email}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {submission.duration != null && (
              <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {formatDuration(submission.duration)}
              </span>
            )}
            {hasScore && (
              <div className="bg-surface-bright border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">star</span>
                <span className="font-title-sm text-title-sm text-on-surface">{submission.score}</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-full h-px bg-outline-variant/20 my-1" />
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mb-1">Director&apos;s Note</p>
          <p className={`font-body-sm text-body-sm line-clamp-2 ${submission.feedback ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>
            {submission.feedback || 'No feedback yet.'}
          </p>
        </div>
        {(isDirector || isPreselector) && (
          <button className="mt-1 bg-surface-container-high text-on-surface font-title-sm text-title-sm py-2 px-4 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            Review
          </button>
        )}
        {isDirector && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="mt-1 border border-error/30 text-error font-title-sm text-title-sm py-2 px-4 rounded hover:bg-error-container/20 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function EditRoundModal({
  round,
  onClose,
  onSaved,
}: {
  round: { id: string; number: number; castingId: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [number, setNumber] = useState(round.number.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const num = parseInt(number, 10);
    if (isNaN(num) || num < 1) {
      setError('Round number must be a positive integer');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await client.patch(`/rounds/${round.id}`, { number: num });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update round');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit round">
      <div className="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-sm mx-4 p-6">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Edit Round</h2>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-2 block">Round Number</label>
          <input
            type="number"
            min="1"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full bg-surface border border-outline-variant/50 rounded-lg p-3 font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-error font-body-sm text-body-sm mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="py-2 px-4 rounded font-title-sm text-title-sm text-on-surface-variant hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="py-2 px-5 rounded font-title-sm text-title-sm bg-primary-container text-on-primary-container hover:bg-primary-container/80 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
