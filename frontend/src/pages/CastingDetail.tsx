import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';

interface Participant {
  userId: string;
  role: string;
}

interface Round {
  id: string;
  number: number;
  participants: { actorId: string; role: string }[];
}

interface Casting {
  id: string;
  title: string;
  description: string;
  participants: Participant[];
  rounds: Round[];
}

export default function CastingDetail() {
  const { castingId } = useParams<{ castingId: string }>();
  const { getRoleInCasting, isDirectorOf } = useUser();
  const [casting, setCasting] = useState<Casting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = castingId ? getRoleInCasting(castingId) : null;
  const isDirector = castingId ? isDirectorOf(castingId) : false;

  useEffect(() => {
    if (!castingId) return;
    client.get(`/castings/${castingId}`)
      .then((res) => setCasting(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [castingId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading casting...
      </div>
    );
  }

  if (error || !casting) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-xl">
        Error: {error || 'Casting not found'}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/dashboard" className="text-primary hover:text-primary-fixed-dim transition-colors font-body-sm text-body-sm flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-background">
              {casting.title}
            </h1>
            <p className="text-on-surface-variant mt-2 font-body-lg text-body-lg">
              {casting.description}
            </p>
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
          {casting.participants.map((p) => (
            <div key={p.userId} className="flex items-center gap-3 bg-surface-container-high rounded-lg p-3">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-sm">person</span>
              </div>
              <div>
                <p className="text-sm text-on-surface">{p.userId}</p>
                <p className="text-xs text-on-surface-variant uppercase">{p.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-headline-md text-on-background">Rounds</h2>
          {isDirector && (
            <button className="bg-primary-container text-on-primary-container font-title-sm text-title-sm py-2 px-4 rounded hover:bg-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Round
            </button>
          )}
        </div>
        <div className="space-y-3">
          {casting.rounds.map((round) => (
            <Link
              key={round.id}
              to={`/rounds/${round.id}`}
              className="flex items-center justify-between bg-surface-container-high rounded-lg p-4 hover:bg-surface-container-low transition-colors"
            >
              <div>
                <p className="text-on-surface font-title-sm text-title-sm">Round {round.number}</p>
                <p className="text-on-surface-variant text-xs">{round.participants.length} participants</p>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </Link>
          ))}
          {casting.rounds.length === 0 && (
            <p className="text-on-surface-variant text-sm">No rounds yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
