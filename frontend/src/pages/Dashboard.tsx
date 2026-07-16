import { Link } from 'react-router-dom';

export default function Dashboard() {
  const userId = localStorage.getItem('userId');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Bienvenido. Tu ID de usuario: <code className="bg-gray-100 px-1 rounded">{userId}</code>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/castings"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ver Castings</h3>
          <p className="text-gray-500 text-sm">
            Lista todos los castings existentes con sus participantes y rondas.
          </p>
        </Link>

        <Link
          to="/castings/create"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Crear Casting</h3>
          <p className="text-gray-500 text-sm">
            Crea un nuevo casting con título, descripción y director.
          </p>
        </Link>
      </div>
    </div>
  );
}
