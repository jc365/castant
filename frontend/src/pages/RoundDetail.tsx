import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';
import SubmitVideoModal from '../components/SubmitVideoModal';
import VideoPlayerModal from '../components/VideoPlayerModal';
import CreateNextRoundModal from '../components/CreateNextRoundModal';

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
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  const role = roundId ? getRoleInRound(roundId) : null;
  const isDirector = round ? isDirectorOf(round.castingId) : false;
  const isActor = roundId ? isActorOf(roundId) : false;
  const isPreselector = roundId ? isPreselectorOf(roundId) : false;

  useEffect(() => {
    if (!roundId) return;
    client.get(`/rounds/${roundId}`)
      .then((res) => setRound(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roundId]);

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
                Round {round.number}
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
      <div className="w-80 flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant/30 p-6 flex flex-col gap-8 overflow-y-auto">
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
                      <p className="font-body-sm text-body-sm text-on-surface leading-tight">{p.id}</p>
                      <p className="font-label-caps text-label-caps text-on-surface-variant">Preselector {p.email}</p>
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
            <ul className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2">
              {actors.map((a) => {
                const submitted = round.submissions.some((s) => s.actorId === a.id);
                const passed = round.submissions.some((s) => s.actorId === a.id && s.score !== null && s.score < 5);
                return (
                  <li key={a.id} className={`flex items-center justify-between p-2 rounded hover:bg-surface-container transition-colors cursor-pointer group ${passed ? 'opacity-50' : ''}`}>
                    <span className={`font-body-sm text-body-sm ${passed ? 'text-on-surface-variant' : 'text-on-surface group-hover:text-primary'} transition-colors`}>
                      {a.id}
                    </span>
                    {passed ? (
                      <span className="material-symbols-outlined text-[14px] text-error" title="Passed">close</span>
                    ) : submitted ? (
                      <span className="w-2 h-2 rounded-full bg-primary" title="Submitted" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-outline-variant" title="Pending" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-on-surface-variant text-sm">No actors assigned.</p>
          )}
        </section>

        {/* Create Next Round */}
        {isDirector && (
          <button
            onClick={() => setShowCreateNextRound(true)}
            className="w-full py-2 bg-primary-container text-on-primary-container font-label-caps text-label-caps rounded hover:bg-primary-container/80 transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Create Next Round
          </button>
        )}
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
          client.get(`/rounds/${roundId}`).then((res) => setRound(res.data));
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
    </div>
  );
}

function SubmissionCard({
  submission,
  isDirector,
  isPreselector,
  onPlay,
}: {
  submission: Submission;
  isDirector: boolean;
  isPreselector: boolean;
  onPlay: () => void;
}) {
  const hasScore = submission.score !== null;
  const status = hasScore ? (submission.score! >= 5 ? 'PASSED' : 'REVIEWED') : 'NEW';

  return (
    <div className={`bg-surface-container-low border border-outline-variant/30 rounded-xl overflow-hidden group hover:border-primary/50 transition-colors duration-300 ${!hasScore && status === 'PASSED' ? 'opacity-75 grayscale-[20%]' : ''}`}>
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
        <div className={`absolute top-3 left-3 px-2 py-1 rounded font-label-caps text-label-caps backdrop-blur-sm ${
          status === 'NEW'
            ? 'bg-inverse-primary/90 text-on-primary-container'
            : status === 'PASSED'
            ? 'bg-surface-variant text-on-surface-variant border border-outline-variant/50'
            : 'bg-primary-container/20 text-primary-fixed-dim border border-primary-container/30'
        }`}>
          {status}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-title-sm text-title-sm text-on-surface truncate">{submission.actorId}</h3>
          </div>
          {hasScore && (
            <div className="bg-surface-bright border border-outline-variant/50 px-2 py-1 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">star</span>
              <span className="font-title-sm text-title-sm text-on-surface">{submission.score}</span>
            </div>
          )}
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
      </div>
    </div>
  );
}
