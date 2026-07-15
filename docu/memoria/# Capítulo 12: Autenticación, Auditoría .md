# Capítulo 12: Autenticación, Auditoría y Gobernanza de la Base de Datos

## 12.1. Introducción

En esta sesión, el proyecto ha dado un salto cualitativo hacia un sistema profesional, seguro y mantenible. Se han abordado tres frentes fundamentales que transforman un sistema funcional en un sistema robusto y preparado para entornos reales:

1.  **Autenticación y Seguridad:** Implementación de un sistema de login con JWT y hash de contraseñas.
2.  **Organización y Gobernanza de la API:** Refactorización de las rutas para agruparlas por middleware, mejorando la claridad y la mantenibilidad.
3.  **Gobernanza de la Base de Datos:** Creación de un sistema de backups automáticos y restauración para evitar la pérdida accidental de datos.

## 12.2. Sistema de Autenticación Híbrido: JWT y Modo Demo

Se implementó un sistema de autenticación híbrido que permite al sistema funcionar en dos modos, controlados por la variable de entorno `DEMO_MODE`.

### 12.2.1. Diseño de la Autenticación

| Variable | Valor | Comportamiento |
|----------|-------|----------------|
| `DEMO_MODE=true` | Modo Demo | Permite peticiones sin token. Usa el header `X-User-Id` o el usuario `'user-demo'`. |
| `DEMO_MODE=false` | Modo Real | Requiere un JWT válido en el header `Authorization: Bearer <token>`. |

### 12.2.2. Gestión de Contraseñas

Se añadió el campo `password` al modelo `User` y se implementó un servicio de hash (`HashService`) basado en `bcrypt` para:

- **Hashear contraseñas:** Al crear un usuario, la contraseña se hashea antes de guardarse en la base de datos.
- **Comparar contraseñas:** En el login, la contraseña proporcionada se compara con el hash almacenado.

**Esquema de Prisma actualizado:**
```prisma
model User {
  id        String   @id
  name      String
  email     String   @unique
  password  String   // 👈 Nuevo campo
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}
```

12.2.3. Flujo de Login

    El cliente envía email y password a POST /api/v1/auth/login.

    LoginUseCase busca al usuario por email.

    Si el usuario existe, HashService.compare() verifica la contraseña.

    Si es correcta, se genera un JWT con userId.

    Se devuelve { token, userId }.

12.3. Refactorización de Rutas y Middlewares

Para mejorar la claridad y la mantenibilidad, se refactorizó la estructura de las rutas para agruparlas por middleware, siguiendo el patrón de Laravel.
12.3.1. Estructura Antes y Después
Aspecto	Antes	Después
Ubicación del middleware	index.ts (montado globalmente).	routes.ts (agrupado por sub-routers).
Rutas públicas	Mezcladas con las protegidas.	Agrupadas al principio (fuera del middleware).
Rutas protegidas	Pasaban por authMiddleware en index.ts.	Agrupadas con router.use(authMiddleware).
12.3.2. Estructura Final en routes.ts
typescript

const router = Router();

// ============================================
// Rutas públicas (sin autenticación)
// ============================================
router.post('/auth/login', ...);

// ============================================
// Rutas protegidas (requieren autenticación)
// ============================================
router.use(authMiddleware);

router.get('/users', ...);
router.post('/users', ...);
router.post('/submissions', ...);
// ... resto de rutas protegidas

export default router;

Ventajas:

    Claridad: Las rutas públicas están claramente separadas de las protegidas.

    Mantenibilidad: Añadir una nueva ruta pública o protegida es sencillo.

    Escalabilidad: Se pueden crear sub-routers con diferentes combinaciones de middlewares.

12.4. Sistema de Gobernanza de la Base de Datos

Se implementó un sistema de backups automáticos para proteger los datos de la base de datos de desarrollo (dev.db) ante cambios destructivos del esquema.
12.4.1. Scripts de Backup y Restauración
Script	Descripción
db:backup	Crea una copia de seguridad de dev.db en prisma/backups/ con un timestamp.
db:restore	Restaura el último backup basándose en el timestamp del nombre del archivo.
db:reset	Backup + Reset (flujo recomendado).
db:push	Sincroniza el esquema sin perder datos.
db:push:force	Backup + Reset (alternativa).
12.4.2. Flujo de Trabajo Recomendado

    Antes de modificar schema.prisma: Ejecutar npm run db:backup.

    Modificar el esquema.

    Aplicar cambios:

        npm run db:push (si es seguro) o npm run db:reset (si es destructivo).

    Si algo falla: npm run db:restore.

12.4.3. Ubicación de los Backups
text

backend/prisma/backups/
├── dev-2026-07-15T18-30-45.db
├── dev-2026-07-15T19-15-22.db
└── ...

12.5. Evolución del Agente (OpenCode)

Durante esta sesión, el agente (OpenCode) demostró una vez más su capacidad para:

    Ejecutar refactorizaciones complejas: Agrupar rutas por middleware y mover el authMiddleware de index.ts a routes.ts.

    Implementar funcionalidades de seguridad: Añadir hash de contraseñas y JWT.

    Crear herramientas de gobernanza: Scripts de backup y restauración.

    Actualizar la documentación: AGENTS.md se actualizó con toda la nueva información, y se crearon copias de seguridad siguiendo la política establecida.

12.6. Resultados
Aspecto	Estado
Autenticación	✅ Híbrida (JWT + Demo) con hash de contraseñas.
Rutas	✅ Agrupadas por middleware con estructura clara.
Base de Datos	✅ Sistema de backups y restauración implementado.
Tests	✅ 197 tests pasando.
Documentación	✅ AGENTS.md actualizado y backups creados.
12.7. Conclusión

La implementación de la autenticación híbrida, la refactorización de las rutas y el sistema de backups han transformado el sistema en una aplicación robusta, segura y profesional. El enfoque de desarrollo asistido por IA, combinado con la supervisión humana y la documentación rigurosa, ha demostrado ser una metodología eficaz para construir sistemas complejos de forma ágil y fiable.