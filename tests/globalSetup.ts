// tests/globalSetup.ts
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// 👇 Obtener la ruta absoluta de la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // 👈 Sube un nivel desde tests/

export default async function globalSetup() {
  const testDbPath = path.resolve(projectRoot, 'backend', 'test.db');
  
  console.log('🔄 Configurando base de datos de tests en:', testDbPath);
  process.env.DATABASE_URL = `file:${testDbPath}`;

  try {
    // 👇 Ejecutar prisma db push con la URL correcta
    execSync(
      `cd ${path.join(projectRoot, 'backend')} && npx prisma db push --force-reset`,
      {
        stdio: 'pipe',
        env: {
          ...process.env,
          DATABASE_URL: `file:${testDbPath}`,
        },
      }
    );
    console.log('✅ Base de datos de tests lista');
  } catch (error: any) {
    console.error('❌ Error al crear la base de datos de tests:', error.stdout?.toString() || error.message);
  }
}