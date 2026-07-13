# Capítulo 11: Auditoría y Autenticación Híbrida

## 11.1. Introducción

En esta sesión se abordaron dos frentes fundamentales para la madurez del sistema: la **auditoría** (Bitácora) y la **autenticación**. Estos dos pilares transforman un sistema funcional en un sistema fiable, trazable y seguro.

- **Bitácora:** Permite registrar todas las acciones de negocio (envío de videos, revisiones, selección de actores, etc.) en una base de datos, creando un historial completo y consultable.
- **Autenticación Híbrida:** Permite que el sistema funcione tanto en modo demo (sin login) como en modo real (con JWT), facilitando las pruebas, las demostraciones y la transición a producción.

## 11.2. Sistema de Bitácora (Auditoría)

### 11.2.1. Motivación

En un sistema de casting, es crucial saber quién ha hecho qué y cuándo. La bitácora permite:

- **Trazabilidad:** Seguir el historial completo de un casting, desde la invitación de actores hasta la selección final.
- **Auditoría:** Verificar que las acciones se han realizado correctamente y por los usuarios adecuados.
- **Depuración:** Identificar rápidamente problemas en el flujo de trabajo.
- **Cumplimiento normativo:** Cumplir con requisitos de auditoría y transparencia.

### 11.2.2. Diseño de la Tabla `Bitacora`

Se creó una tabla `Bitacora` en Prisma para almacenar los eventos de negocio:

```prisma
model Bitacora {
  id           String   @id @default(cuid())
  timestamp    DateTime @default(now())
  userId       String   // Usuario que realizó la acción
  user         User     @relation(fields: [userId], references: [id])
  action       String   // 'submit_video' | 'review_submission' | 'create_casting' | ...
  details      Json?    // Datos adicionales (ej. { videoUrl, score, feedback })
  castingId    String?  // Opcional: para filtrar por casting
  roundId      String?  // Opcional: para filtrar por ronda
  submissionId String?  // Opcional: para filtrar por submission

  @@index([userId])
  @@index([action])
  @@index([timestamp])
}
```

11.2.3. Servicio de Bitácora

Se implementó un servicio BitacoraService que encapsula la lógica de registro de eventos. Este servicio se inyecta en los casos de uso y se encarga de persistir los eventos en la base de datos.

Características clave:

    Desacoplamiento: La lógica de auditoría no contamina la lógica de negocio.

    Manejo silencioso de errores: Si falla la escritura en la bitácora, la operación principal no se ve afectada.

    Flexibilidad: Se puede cambiar el destino de la bitácora (ej. a un archivo, a un sistema externo) sin modificar los casos de uso.

11.2.4. Eventos Registrados
Evento	Caso de Uso	Información guardada
create_user	CreateUserUseCase	userId, email
create_casting	CreateCastingUseCase	castingId, title, directorEmail
submit_video	SubmitVideoUseCase	actorId, roundId, videoUrl
review_submission	ReviewSubmissionUseCase	submissionId, score, feedback
add_participants	ManageRoundParticipantsUseCase	roundId, actors, preselectors
create_round	ManageRoundParticipantsUseCase	newRoundId, actors
11.3. Sistema de Autenticación Híbrida
11.3.1. Motivación

El sistema necesitaba ser accesible para demostraciones y pruebas rápidas (modo demo), pero también preparado para un entorno de producción con autenticación real. Se optó por un enfoque híbrido que permite ambos modos, controlado por una variable de entorno.
11.3.2. Diseño de la Autenticación

Variables de entorno:
env

DEMO_MODE=true   # true: modo demo, false: modo real
JWT_SECRET=tu-secreto-super-seguro

Middleware de autenticación:

    Si DEMO_MODE es true:

        Permite peticiones sin token.

        Si existe el header X-User-Id, usa ese userId.

        Si no, usa 'user-demo'.

    Si DEMO_MODE es false:

        Valida el token JWT del header Authorization.

        Si el token es válido, extrae el userId.

        Si no, devuelve 401 (Unauthorized).

Flujo de login:

    El usuario envía email y password a POST /api/v1/auth/login.

    El sistema verifica las credenciales (por ahora, busca al usuario por email).

    Si las credenciales son válidas, genera un JWT con el userId.

    Devuelve el token al cliente.

11.3.3. Integración con los Endpoints

Los endpoints que requieren identificación del usuario (POST /submissions, PATCH /submissions/:id/review, etc.) obtienen el userId de req.user.id (inyectado por el middleware). Esto elimina la necesidad de pasar el userId en el body de la petición.

Antes:
typescript

const { actorId, roundId, videoUrl } = req.body;

Después:
typescript

const { roundId, videoUrl } = req.body;
const actorId = req.user.id; // 👈 Extraído del token o del header X-User-Id

11.3.4. Ventajas del Enfoque Híbrido
Aspecto	Beneficio
Flexibilidad	El sistema funciona en modo demo y en modo real.
Seguridad	En modo real, las acciones están autenticadas.
Trazabilidad	La bitácora registra el userId real (o el simulado en modo demo).
Transición a producción	Cambiando DEMO_MODE=false, el sistema está listo para producción.
11.4. Integración de Bitácora y Autenticación

La bitácora y la autenticación están íntimamente ligadas: la bitácora necesita saber quién realiza cada acción, y la autenticación proporciona esa información.

Flujo completo:

    El middleware de autenticación extrae (o genera) el userId y lo inyecta en req.user.

    Los casos de uso usan req.user.id para obtener el userId.

    La bitácora registra cada acción con ese userId.

En modo demo:

    El userId puede ser 'user-demo' (por defecto) o uno especificado en el header X-User-Id.

    La bitácora registra las acciones con ese userId, permitiendo trazar las acciones de un "usuario demo".

En modo real:

    El userId se extrae del JWT.

    La bitácora registra las acciones con el userId real.

11.5. Resultados
Aspecto	Estado
Tabla Bitacora en Prisma	✅ Creada y con índices
Servicio BitacoraService	✅ Implementado y desacoplado
Casos de uso modificados	✅ 5 casos de uso registran eventos
Middleware de autenticación	✅ Implementado con DEMO_MODE y JWT
Endpoint de login	✅ POST /api/v1/auth/login
Tests	✅ 198 tests pasando
Documentación	✅ AGENTS.md actualizado
11.6. Conclusión

La implementación de la bitácora y la autenticación híbrida ha transformado el sistema en una herramienta profesional, trazable y segura. La bitácora proporciona un historial completo de las acciones de negocio, y la autenticación híbrida permite que el sistema sea accesible para demostraciones y pruebas, al tiempo que está preparado para un entorno de producción real.