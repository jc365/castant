# Capítulo 6: De la Arquitectura a la Ejecución: Implementación de la Capa de Infraestructura y API

## 6.1. Introducción

Tras consolidar la capa de dominio y aplicación con una cobertura de código excepcional, el siguiente objetivo fue **dar vida al sistema**. Esta fase se centró en implementar los elementos necesarios para que la aplicación fuera ejecutable y depurable, sentando las bases para un desarrollo ágil y con trazabilidad.

Los objetivos principales de esta sesión fueron:
1.  **Sistema de Logging:** Establecer un sistema de logs estructurado y correlacionado para facilitar la depuración y el monitoreo.
2.  **Base de Datos y ORM:** Integrar una base de datos (SQLite) con Prisma para la persistencia de datos.
3.  **API HTTP:** Desplegar un servidor Express con endpoints funcionales que expusieran la lógica de negocio de los casos de uso.

## 6.2. Implementación del Sistema de Logging

Para garantizar la trazabilidad de las peticiones, se implementó un sistema de logging basado en `pino` y `pino-http`.

### 6.2.1. Elección de Tecnologías

- **`pino`:** Se eligió por su alto rendimiento y su formato de salida JSON, que facilita el parseo y la integración con sistemas de gestión de logs.
- **`pino-http`:** Se utilizó como middleware de Express para loguear automáticamente todas las peticiones HTTP, incluyendo método, URL, código de estado y tiempo de respuesta.
- **`pino-pretty`:** Se configuró para el entorno de desarrollo, ofreciendo una salida legible y coloreada para facilitar la depuración manual.

### 6.2.2. Correlación de Logs con `requestId`

Uno de los mayores desafíos en sistemas distribuidos es seguir el rastro de una petición a través de múltiples logs. Para resolverlo, se implementó un sistema de correlación basado en `AsyncLocalStorage`:

1.  **Middleware de Contexto:** Se creó un middleware (`requestContextMiddleware`) que genera un `requestId` único (usando `nanoid` de 10 caracteres) para cada petición.
2.  **Almacenamiento en `AsyncLocalStorage`:** El `requestId` se almacena en el contexto asíncrono de la petición, haciéndolo accesible desde cualquier punto del código que se ejecute durante esa petición.
3.  **Logger Enriquecido:** Se creó un logger que, al ser llamado, obtiene el `requestId` del contexto y lo añade automáticamente al objeto de log.
4.  **Correlación Automática:** De esta forma, **todos los logs** (tanto los automáticos de `pino-http` como los manuales de los casos de uso) comparten el mismo `requestId`, permitiendo un filtrado y seguimiento sencillo.

**Gotcha documentado:** El `requestContextMiddleware` debe colocarse **antes** de `pino-http` para que el `requestId` esté disponible para todos los middlewares y rutas.

## 6.3. Integración de Base de Datos y ORM

Para la persistencia de datos, se optó por **Prisma** como ORM y **SQLite** como base de datos para el entorno de desarrollo, por su simplicidad y facilidad de configuración.

### 6.3.1. Configuración de Prisma

- Se instaló Prisma y se inicializó con `npx prisma init`.
- Se definieron los modelos en `schema.prisma` basándose en las entidades del dominio: `Actor`, `Director`, `Casting`, `Round`, `RoundActor` (tabla de relación) y `Submission`.
- **Gotcha importante (Prisma 7):** La URL de conexión (`DATABASE_URL`) se configura en `prisma.config.ts` y en `.env`, no directamente en `schema.prisma`.

### 6.3.2. Implementación de Repositorios con Prisma

Se implementaron los repositorios concretos (ej. `PrismaActorRepository`) que implementan las interfaces definidas en la capa de aplicación. Estos repositorios:
- Usan una instancia singleton de `PrismaClient`.
- Mapean los registros de la base de datos a las entidades de dominio y viceversa.
- Proporcionan operaciones CRUD para las entidades.

## 6.4. Desarrollo de la API con Express

Se desplegó un servidor Express para exponer la lógica de negocio a través de una interfaz HTTP.

### 6.4.1. Configuración del Servidor

- **Punto de Entrada:** `backend/src/index.ts`.
- **Middlewares:** Se configuraron `cors`, `express.json()`, el middleware de contexto (`requestContextMiddleware`) y `pino-http`.
- **Runtime:** Se utilizó `tsx` como ejecutor de TypeScript en lugar de `ts-node`, por su mejor soporte para ESM y su rendimiento.
- **Scripts:** Se añadió `npm run dev` en el `package.json` para arrancar el servidor en modo desarrollo.

### 6.4.2. Endpoints Implementados

Se implementaron los endpoints básicos para la entidad `Actor`:

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check del servidor. |
| `GET` | `/actors/:id` | Obtener un actor por su ID. |
| `POST` | `/actors` | Crear un nuevo actor. |
| `DELETE` | `/actors/:id` | Eliminar un actor. |

**Gotcha documentado:** Se estableció una regla de oro: **NUNCA añadir extensiones `.js` a las importaciones**. El proyecto funciona sin ellas, y `tsx` (al igual que `moduleResolution: "node16"`) las resuelve automáticamente. Añadirlas rompe el proyecto.

## 6.5. Lecciones Aprendidas

1.  **La correlación de logs es fundamental:** Un `requestId` bien implementado transforma un sistema difícil de depurar en uno transparente y rastreable.
2.  **`AsyncLocalStorage` es una herramienta poderosa:** Permite propagar el contexto sin tener que pasarlo manualmente a través de toda la cadena de funciones.
3.  **La elección del runtime importa:** `tsx` demostró ser una alternativa superior a `ts-node` para proyectos ESM, eliminando errores de extensión y mejorando la velocidad de ejecución.
4.  **La IA puede ser un aliado excepcional:** Con prompts claros y directrices específicas (como las de `AGENTS.md`), el agente (OpenCode) fue capaz de implementar esta infraestructura compleja de forma rápida y fiable, aprendiendo de los errores y ajustando su comportamiento.

## 6.6. Conclusión

Esta sesión marcó la transición del proyecto desde una arquitectura teórica a un **sistema ejecutable y bien instrumentado**. La combinación de logs correlacionados, una base de datos funcional y una API REST operativa ha sentado las bases para el desarrollo de las funcionalidades restantes del sistema de casting.