# Capítulo 8: Refactorización del Modelo de Usuarios y Consolidación de la Capa de Aplicación

## 8.1. Introducción

Tras la implementación inicial de la capa de aplicación, se identificó una evolución necesaria en el modelo de dominio: la entidad `Actor` había trascendido su significado original. Originalmente concebida para representar a un intérprete en un casting, su uso se había extendido para abarcar a todos los participantes del sistema (actores, preselectores, directores, etc.), que podían desempeñar diferentes roles según el contexto.

Esta sesión se centró en dos grandes objetivos:
1.  **Refactorizar la entidad `Actor` a `User`**, alineando el modelo de dominio con la realidad del negocio.
2.  **Consolidar la lógica de gestión de participantes** en rondas, unificando el tratamiento de actores y preselectores.
3.  **Implementar el caso de uso de valoración de videos (`ReviewSubmissionUseCase`)**, completando el ciclo de evaluación del casting.

## 8.2. Refactorización de `Actor` a `User`

La decisión de renombrar `Actor` a `User` responde a la necesidad de un modelo de dominio más expresivo y general. Un `User` es una persona que participa en el sistema, y su rol (actor, preselector, director) se determina por su relación con una ronda o un casting, no por un atributo fijo de la entidad.

### 8.2.1. Cambios Estructurales

| Componente | Antes | Después |
|------------|-------|---------|
| **Entidad** | `Actor` | `User` |
| **ID** | `ActorId` | `UserId` (con `ActorId` como alias deprecated) |
| **Repositorio** | `IActorRepository` | `IUserRepository` |
| **Implementación** | `PrismaActorRepository` | `PrismaUserRepository` |
| **Caso de Uso** | `CreateActorUseCase` | `CreateUserUseCase` |
| **Endpoint** | `/api/v1/actors` | `/api/v1/users` |
| **Tabla en BD** | `Actor` | `User` |

### 8.2.2. Estrategia de Migración

Para garantizar la estabilidad del sistema, se siguió una estrategia de migración por capas:
1.  **Domain:** Se renombró la entidad y se actualizaron los Value Objects (`TypedId`).
2.  **Application:** Se renombraron los repositorios y casos de uso.
3.  **Infrastructure:** Se actualizó el repositorio Prisma y el esquema de la base de datos.
4.  **API:** Se actualizaron los endpoints y DTOs.
5.  **Tests:** Se adaptaron todos los tests a la nueva nomenclatura.

Se mantuvo compatibilidad hacia atrás mediante alias (ej. `ActorId` como alias de `UserId`) para minimizar el impacto en el código existente.

## 8.3. Consolidación de la Gestión de Participantes

La lógica de gestión de participantes en rondas se refactorizó para unificar el tratamiento de actores y preselectores, y para hacer el código más legible y eficiente.

### 8.3.1. Estructura del DTO

Se adoptó un DTO con listas separadas por rol, en lugar de una lista única con un campo `role`:

```typescript
export interface ManageRoundParticipantsInput {
  roundId: string;
  actors: { email: string; name?: string }[];
  preselectors: { email: string; name?: string }[];
  createNewRound?: boolean;
}
```

Ventajas:

    Explicitud: El rol viene dado por la lista en la que se encuentra el participante.

    Escalabilidad: Añadir un nuevo rol (ej. reviewers) solo requiere añadir una nueva lista.

### 8.3.2. Métodos Auxiliares

Se introdujeron dos métodos privados para separar responsabilidades:

    detectAndAddUsers(inputs): Crea o recupera usuarios a partir de una lista de emails. Devuelve un Set<string> con los IDs únicos. Centraliza la lógica de creación de usuarios, evitando duplicados.

    buildParticipantEntries(currentParticipants, newIds, role): Combina los participantes existentes con los nuevos para un rol específico, utilizando Set para eliminar duplicados de forma eficiente. Devuelve la lista completa de RoundParticipantEntry para ese rol.

### 8.3.3. Flujo Principal

El flujo principal de ManageRoundParticipantsUseCase se simplificó considerablemente:

```typescript
const actorIds = await this.detectAndAddUsers(actorInputs);
const preselectorIds = await this.detectAndAddUsers(preselectorInputs);

const actorEntries = this.buildParticipantEntries(currentRound.participants, actorIds, 'actor');
const preselectorEntries = this.buildParticipantEntries(currentRound.participants, preselectorIds, 'preselector');

const updatedParticipants = [...actorEntries, ...preselectorEntries];
```

Este diseño es declarativo, eficiente y fácil de mantener.
## 8.4. Implementación de la Valoración de Videos (ReviewSubmissionUseCase)

Se implementó el caso de uso ReviewSubmissionUseCase para permitir al director valorar los videos enviados por los actores.
### 8.4.1. Lógica de Negocio

    Validación de la Submission: Se busca la submission por ID. Si no existe, se lanza un error.

    Validación de la Ronda y el Casting: Se recupera la ronda y el casting asociados para verificar el contexto.

    Validación de Estado: Se comprueba que la submission esté en estado pending. Si ya ha sido revisada, se lanza un error.

    Creación de Value Objects: Se crean los objetos Score y Feedback con sus validaciones internas (score entre 1 y 10, feedback no vacío, etc.).

    Actualización de la Entidad: Se utiliza el método review de la entidad Submission para crear una nueva instancia con estado reviewed.

    Persistencia: Se guarda la submission actualizada.

### 8.4.2. Endpoint

Se añadió el endpoint PATCH /api/v1/submissions/:id/review, que recibe en el body { score, feedback } y devuelve la submission actualizada.

### 8.4.3. Tests

Se crearon 5 tests unitarios que cubren el caso feliz y los casos de error (submission no encontrada, ya revisada, score inválido, etc.).

## 8.5. Gestión del Agente (OpenCode) y Documentación

Durante esta sesión, el agente (OpenCode) demostró una madurez significativa:

    Refactorización Compleja: Ejecutó el refactor de Actor a User en todas las capas (domain, application, infrastructure, API) sin errores.

    Comprensión del Contexto: Entendió la necesidad de mantener compatibilidad hacia atrás mediante alias.

    Actualización Automática de AGENTS.md: Tras cada cambio, actualizó la documentación del proyecto, creando copias de seguridad siguiendo la política establecida.

Este comportamiento confirma que el agente ha internalizado las reglas y patrones del proyecto, y es capaz de realizar tareas de refactorización de gran envergadura con mínima supervisión.

## 8.6. Resultados y Estado del Proyecto

    Tests: 174 tests pasando en 20 archivos.

    Cobertura de Casos de Uso: Se han implementado y testeado todos los casos de uso principales del sistema:

        Creación de usuarios (CreateUserUseCase)

        Creación de castings (CreateCastingUseCase)

        Envío de videos (SubmitVideoUseCase)

        Gestión de participantes (ManageRoundParticipantsUseCase)

        Selección de actores para siguiente ronda (SelectActorsForNextRoundUseCase)

        Valoración de videos (ReviewSubmissionUseCase)

    Endpoints de Escritura: Completos y funcionales.

    Documentación: AGENTS.md actualizado y sincronizado con el código.

## 8.7. Conclusión

La sesión de refactorización y consolidación ha culminado con un sistema más coherente, expresivo y mantenible. El cambio de Actor a User alinea el modelo de dominio con la realidad del negocio, y la lógica de gestión de participantes es ahora más clara y eficiente. La implementación de ReviewSubmissionUseCase cierra el ciclo de evaluación del casting, preparando el sistema para los siguientes pasos: la implementación de endpoints de consulta (GET). 
Ventajas:

    Explicitud: El rol viene dado por la lista en la que se encuentra el participante.

    Escalabilidad: Añadir un nuevo rol (ej. reviewers) solo requiere añadir una nueva lista.

