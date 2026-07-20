import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';

interface Participant {
  userId: string;
  role: string;
}

interface Casting {
  id: string;
  title: string;
  description: string;
  participants: Participant[];
}

export default function Dashboard() {
  const { participations, getRoleInCasting } = useUser();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/castings')
      .then((res) => setCastings(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const myCastingIds = new Set(
    participations
      .filter((p) => p.type === 'casting')
      .map((p) => p.castingId)
  );

  const filteredCastings = castings.filter((c) => myCastingIds.has(c.id));

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-display-lg text-display-lg text-on-background">
          Your Castings
        </h1>
        <p className="text-on-surface-variant mt-2 font-body-lg text-body-lg">
          Manage ongoing projects and review talent submissions.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6">
          Error loading castings: {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading castings...
        </div>
      )}

      {/* Castings Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {filteredCastings.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <span className="material-symbols-outlined text-6xl text-outline mb-4 block">movie_creation</span>
              <p className="text-on-surface-variant font-body-lg text-body-lg">
                No castings yet. Create your first one.
              </p>
            </div>
          ) : (
            filteredCastings.map((casting) => (
              <CastingCard key={casting.id} casting={casting} role={getRoleInCasting(casting.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CastingCard({ casting, role }: { casting: Casting; role: string | null }) {
  const directorCount = casting.participants.filter((p) => p.role === 'director').length;

  return (
    <Link
      to={`/castings/${casting.id}`}
      className="group relative bg-surface border border-outline-variant/30 rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="absolute inset-0 bg-surface-container-low opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="p-6 flex-1 flex flex-col z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-label-caps text-label-caps text-on-surface uppercase">
              {role || 'Active'}
            </span>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>

        <h3 className="font-headline-md text-headline-md text-on-background mb-1">
          {casting.title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 line-clamp-2">
          {casting.description}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
              Participants
            </p>
            <p className="font-title-sm text-title-sm text-on-surface">
              {casting.participants.length} {casting.participants.length === 1 ? 'Member' : 'Members'}
            </p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
              Directors
            </p>
            <p className="font-title-sm text-title-sm text-on-surface">
              {directorCount}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-high border-t border-outline-variant/30 p-4 z-10 relative">
        <span className="w-full flex items-center justify-between text-primary font-title-sm text-title-sm group-hover:text-primary-fixed transition-colors">
          <span>View Details</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </div>
    </Link>
  );
}
