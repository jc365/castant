import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useUser } from '../context/UserContext';
import { useUserCache } from '../context/UserCacheContext';
import type { SubmissionStatus } from '../utils/submissionStatus';

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

interface RoundSummary {
  id: string;
  number: number;
  castingId: string;
  castingTitle: string;
  submissions: SubmissionData[];
}

interface SubmissionData {
  id: string;
  actorId: string;
  duration: number | null;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
}

interface DashboardStats {
  totalCastings: number;
  activeCastings: number;
  reviewedSubmissions: number;
  pendingSubmissions: number;
}

interface RoundStat {
  id: string;
  label: string;
  count: number;
  max: number;
  castingTitle: string;
}

interface ScoreBucket {
  stars: number;
  count: number;
}

interface ActivityItem {
  id: string;
  type: 'submission' | 'review';
  actorId: string;
  castingTitle: string;
  roundNumber: number;
  score: number | null;
  timestamp: string;
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const { participations } = useUser();
  const { getUser, ensureUser } = useUserCache();
  const [castings, setCastings] = useState<Casting[]>([]);
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const myCastingIds = useMemo(() =>
    new Set(participations.filter((p) => p.type === 'casting').map((p) => p.castingId)),
    [participations]
  );

  const hasLoadedRef = useRef(false);
  const previousIdsRef = useRef<string>('');

  useEffect(() => {
    const currentIds = Array.from(myCastingIds).sort().join(',');

    if (previousIdsRef.current === currentIds && hasLoadedRef.current) {
      setLoading(false);
      return;
    }

    if (previousIdsRef.current !== currentIds) {
      hasLoadedRef.current = false;
      previousIdsRef.current = currentIds;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const castingsRes = await client.get('/castings');
        if (cancelled) return;
        const allCastings: Casting[] = castingsRes.data;
        const myCastings = allCastings.filter((c) => myCastingIds.has(c.id));
        setCastings(myCastings);

        const roundsData: RoundSummary[] = [];
        for (const casting of myCastings) {
          const castingRes = await client.get(`/castings/${casting.id}`);
          if (cancelled) return;
          for (const r of castingRes.data.rounds) {
            const roundRes = await client.get(`/rounds/${r.id}`);
            if (cancelled) return;
            roundsData.push({
              id: r.id,
              number: r.number,
              castingId: casting.id,
              castingTitle: casting.title,
              submissions: roundRes.data.submissions,
            });
          }
        }
        if (!cancelled) {
          setRounds(roundsData);
          hasLoadedRef.current = true;
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [myCastingIds]);

  const stats = useMemo<DashboardStats>(() => {
    let reviewed = 0;
    let pending = 0;
    for (const r of rounds) {
      for (const s of r.submissions) {
        if (s.status === 'pending') pending++;
        else reviewed++;
      }
    }
    const activeCastingIds = new Set(
      rounds.filter((r) => r.submissions.some((s) => s.status === 'pending')).map((r) => r.castingId)
    );
    return {
      totalCastings: castings.length,
      activeCastings: activeCastingIds.size,
      reviewedSubmissions: reviewed,
      pendingSubmissions: pending,
    };
  }, [castings, rounds]);

  const roundStats = useMemo<RoundStat[]>(() => {
    const max = Math.max(1, ...rounds.map((r) => r.submissions.length));
    return rounds.map((r) => ({
      id: r.id,
      label: `Round ${r.number}`,
      count: r.submissions.length,
      max,
      castingTitle: r.castingTitle || '',
    }));
  }, [rounds]);

  const scoreDistribution = useMemo<ScoreBucket[]>(() => {
    const buckets = [0, 0, 0, 0, 0];
    for (const r of rounds) {
      for (const s of r.submissions) {
        if (s.score !== null) {
          const stars = Math.min(5, Math.max(1, Math.round(s.score / 2)));
          buckets[stars - 1]++;
        }
      }
    }
    return buckets.map((count, i) => ({ stars: i + 1, count })).reverse();
  }, [rounds]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    const castingMap = new Map(castings.map((c) => [c.id, c.title]));

    for (const r of rounds) {
      const title = castingMap.get(r.castingId) || 'Unknown';
      for (const s of r.submissions) {
        items.push({
          id: s.id,
          type: s.status !== 'pending' ? 'review' : 'submission',
          actorId: s.actorId,
          castingTitle: title,
          roundNumber: r.number,
          score: s.score,
          timestamp: new Date(),
        });
      }
    }

    return items.slice(0, 10);
  }, [castings, rounds]);

  useEffect(() => {
    recentActivity.forEach((item) => ensureUser(item.actorId));
  }, [recentActivity, ensureUser]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-xl">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display-lg text-display-lg text-on-background">Dashboard</h1>
        <p className="text-on-surface-variant mt-2 font-body-lg text-body-lg">
          Overview of your casting activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon="movie_creation" label="Total Castings" value={stats.totalCastings} />
        <KPICard icon="live_tv" label="Active Castings" value={stats.activeCastings} />
        <KPICard icon="check_circle" label="Reviewed" value={stats.reviewedSubmissions} />
        <KPICard icon="pending" label="Pending" value={stats.pendingSubmissions} />
      </div>

      {/* Castings Grid */}
      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Your Castings</h3>
        {castings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {castings.map((casting) => (
              <CastingCard key={casting.id} casting={casting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-surface border border-outline-variant/30 rounded-xl">
            <span className="material-symbols-outlined text-6xl text-outline mb-4 block">movie_creation</span>
            <p className="text-on-surface-variant font-body-lg text-body-lg">
              No castings yet. Create your first one.
            </p>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions per Round */}
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Submissions per Round</h3>
          {roundStats.length > 0 ? (
            <div className="flex flex-col gap-3">
              {roundStats.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="font-body-sm text-body-sm text-on-surface-variant w-40 text-right truncate" title={r.castingTitle ? `${r.label} — ${r.castingTitle}` : r.label}>
                    {r.castingTitle ? `${r.label} — ${r.castingTitle}` : r.label}
                  </span>
                  <div className="flex-1 h-6 bg-surface-container rounded overflow-hidden">
                    <div
                      className="h-full bg-primary rounded transition-all duration-500"
                      style={{ width: `${(r.count / r.max) * 100}%` }}
                    />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface w-8">{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="bar_chart" message="No rounds yet" />
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Score Distribution</h3>
          {scoreDistribution.some((b) => b.count > 0) ? (
            <div className="flex flex-col gap-3">
              {scoreDistribution.map((b) => (
                <div key={b.stars} className="flex items-center gap-3">
                  <span className="font-body-sm text-on-surface-variant w-28 text-right">
                    {'★'.repeat(b.stars)}{'☆'.repeat(5 - b.stars)}
                  </span>
                  <div className="flex-1 h-6 bg-surface-container rounded overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded transition-all duration-500"
                      style={{ width: `${b.count > 0 ? Math.max(8, (b.count / Math.max(1, ...scoreDistribution.map((x) => x.count))) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="font-body-sm text-on-surface w-8">{b.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="star" message="No reviews yet" />
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl p-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <ul className="flex flex-col divide-y divide-outline-variant/20">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`material-symbols-outlined text-[20px] ${item.type === 'review' ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {item.type === 'review' ? 'rate_review' : 'upload'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-body-sm text-on-surface truncate">
                    <span className="font-medium">{getUser(item.actorId)?.name || item.actorId}</span>
                    {' '}
                    {item.type === 'review' ? 'reviewed in' : 'submitted to'}
                    {' '}
                    <span className="text-on-surface-variant">{item.castingTitle}</span>
                    {' '}
                    <span className="text-on-surface-variant">· Round {item.roundNumber}</span>
                  </p>
                </div>
                {item.score !== null && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-primary">star</span>
                    <span className="font-body-sm text-body-sm text-on-surface">{item.score}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="history" message="No activity yet" />
        )}
      </div>
    </div>
  );
}

function KPICard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      </div>
      <div>
        <p className="font-display-lg text-display-lg text-on-surface">{value}</p>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-10">
      <span className="material-symbols-outlined text-4xl text-outline mb-2 block">{icon}</span>
      <p className="text-on-surface-variant font-body-sm text-body-sm">{message}</p>
    </div>
  );
}

function CastingCard({ casting }: { casting: Casting }) {
  const directorCount = casting.participants.filter((p) => p.role === 'director').length;

  return (
    <Link
      to={`/castings/${casting.id}`}
      className="group relative bg-surface border border-outline-variant/30 rounded-xl overflow-hidden hover:border-primary/50 transition-colors duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="absolute inset-0 bg-surface-container-low opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="p-6 flex-1 flex flex-col z-10">
        <h3 className="font-headline-md text-headline-md text-on-background mb-1">
          {casting.title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 line-clamp-2">
          {casting.description}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Participants</p>
            <p className="font-title-sm text-title-sm text-on-surface">
              {casting.participants.length} {casting.participants.length === 1 ? 'Member' : 'Members'}
            </p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">Directors</p>
            <p className="font-title-sm text-title-sm text-on-surface">{directorCount}</p>
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
