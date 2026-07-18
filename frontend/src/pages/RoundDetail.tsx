import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';

interface Participant {
  id: string;
  role: string;
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
  const { getRoleInRound, isDirectorOf, isActorOf, isPreselectorOf } = useUser();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div>
      <div className="mb-8">
        <Link to={`/castings/${round.castingId}`} className="text-primary hover:text-primary-fixed-dim transition-colors font-body-sm text-body-sm flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Casting
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-background">
              Round {round.number}
            </h1>
          </div>
          {role && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <span className="font-label-caps text-label-caps text-primary uppercase">
                Your role: {role}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl p-6 mb-6">
        <h2 className="font-headline-md text-headline-md text-on-background mb-4">Participants</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {round.participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-surface-container-high rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-sm">person</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">{p.id}</p>
                <p className="text-xs text-on-surface-variant uppercase">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
        {isDirector && (
          <button className="mt-4 bg-surface-container-high text-on-surface font-title-sm text-title-sm py-2 px-4 rounded hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Participants
          </button>
        )}
      </div>

      {/* Submissions */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-headline-md text-on-background">Submissions</h2>
          {isActor && (
            <button className="bg-primary-container text-on-primary-container font-title-sm text-title-sm py-2 px-4 rounded hover:bg-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">upload</span>
              Submit Video
            </button>
          )}
        </div>
        <div className="space-y-3">
          {round.submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-surface-container-high rounded-lg p-4">
              <div>
                <p className="text-on-surface font-title-sm text-title-sm">{s.actorId}</p>
                <p className="text-on-surface-variant text-xs">{s.videoUrl}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.score !== null && (
                  <span className="text-primary font-title-sm text-title-sm">{s.score}/10</span>
                )}
                {(isDirector || isPreselector) && (
                  <button className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">rate_review</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {round.submissions.length === 0 && (
            <p className="text-on-surface-variant text-sm">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
