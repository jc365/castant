import { useEffect, useState } from 'react';
import client from '../api/client';

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

export default function Castings() {
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

  if (loading) return <p className="text-gray-500">Cargando castings...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Castings</h1>
      {castings.length === 0 ? (
        <p className="text-gray-500">No hay castings creados.</p>
      ) : (
        <div className="space-y-4">
          {castings.map((c) => (
            <div key={c.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{c.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{c.description}</p>
                </div>
                <code className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  {c.id}
                </code>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Participantes: {c.participants.length}
                {c.participants.length > 0 && (
                  <span className="ml-2 text-gray-400">
                    ({c.participants.map((p) => p.role).join(', ')})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
