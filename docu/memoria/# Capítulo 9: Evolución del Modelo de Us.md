# Capítulo 9: Evolución del Modelo de Usuarios y Consolidación de la Arquitectura

## 9.1. Introducción

La sesión de desarrollo se centró en una refactorización profunda del modelo de usuarios y en la consolidación de la arquitectura, abordando varios frentes que habían quedado pendientes o que habían evolucionado desde el diseño inicial.

Los objetivos principales fueron:
1.  **Eliminar la complejidad innecesaria** del sistema de IDs tipados (`TypedId`).
2.  **Unificar el modelo de usuarios**, integrando `Director` como un rol de `User` a través de la tabla `Participant`.
3.  **Completar la API** con los endpoints de consulta (`GET`).
4.  **Mejorar la experiencia de desarrollo** con la generación automática de IDs y la creación de la ronda inicial al crear un casting.

## 9.2. Eliminación de `TypedId`: Simplificación del Sistema de IDs

Inicialmente, el sistema utilizaba `TypedId` como un Value Object para garantizar la seguridad de tipos en los IDs de las entidades. Sin embargo, esta abstracción añadía complejidad y fricción en el desarrollo, especialmente al tener que usar `.getValue()` en cada acceso y lidiar con genéricos.

### 9.2.1. Decisión de Diseño

Se decidió eliminar `TypedId` y sustituirlo por un sistema de **IDs como strings planos con prefijos**. Esta decisión se basó en:

- **Simplicidad:** Los IDs son strings, lo que reduce la complejidad y hace el código más legible.
- **Trazabilidad:** Los prefijos (ej. `user-`, `casting-`, `round-`) permiten identificar rápidamente el tipo de entidad, facilitando la depuración.
- **Centralización:** La generación de IDs se centraliza en la entidad, no en los casos de uso.

### 9.2.2. Implementación

Se creó una función `genUUID` en `domain/utils/genUUID.ts` que genera un UUID con un prefijo según la entidad:

```typescript
export function genUUID(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
```

Este cambio eliminó la necesidad de generar IDs en los casos de uso, simplificándolos significativamente.
9.3. Unificación del Modelo de Usuarios: Director como Participant

El modelo de usuarios presentaba una inconsistencia: Actor y Director eran entidades separadas, lo que complicaba la gestión de roles y permisos. Esta refactorización unificó ambos conceptos en una sola tabla Participant.
9.3.1. El Modelo Unificado

Se creó la tabla Participant que relaciona User con Casting o Round, asignando un role a cada relación.
prisma

model Participant {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  castingId String?  // Rol a nivel de casting (ej. director)
  roundId   String?  // Rol a nivel de ronda (ej. actor, preselector)
  role      String   // 'director' | 'actor' | 'preselector' | 'reviewer'
  createdAt DateTime @default(now())
}

9.3.2. Impacto en el Código
Componente	Cambio
Prisma Schema	Eliminación de la tabla Director. Creación de Participant.
Domain (Casting.ts)	Eliminación de directorId. Añadido participants: CastingParticipantEntry[].
CreateCastingUseCase	Ahora crea un Participant con role: 'director' para el usuario que actúa como director.
ReviewSubmissionUseCase	La validación del director se realiza consultando Participant en lugar de Casting.directorId.
API (routes.ts)	El endpoint POST /castings ahora recibe directorEmail y directorName en lugar de directorId.
9.3.3. Ventajas del Nuevo Modelo

    Flexibilidad: Un usuario puede tener diferentes roles en diferentes castings y rondas.

    Simplicidad: Todas las relaciones de roles se gestionan en una sola tabla.

    Escalabilidad: Añadir un nuevo rol (ej. reviewer) solo requiere añadirlo al enum de roles.

    Coherencia: El modelo refleja mejor la realidad del dominio, donde una persona puede participar de diferentes formas en diferentes contextos.

9.4. Completando la API: Endpoints de Consulta (GET)

Se añadieron los endpoints de consulta para completar la API REST:
Método	Endpoint	Descripción
GET	/api/v1/castings	Lista todos los castings con sus participantes.
GET	/api/v1/castings/:id	Obtiene un casting con sus participantes y rondas.
GET	/api/v1/rounds/:id	Obtiene una ronda con sus participantes.
GET	/api/v1/rounds/:id/submissions	Lista las submissions de una ronda.

Estos endpoints permiten explorar el sistema y verificar el estado de los castings, rondas y submissions.
9.5. Mejoras en el Flujo de Creación
9.5.1. Generación Automática de IDs

Ahora los IDs se generan automáticamente en las entidades, lo que simplifica los casos de uso y la API:

    Antes: El caso de uso generaba el ID con EntityId.create y lo pasaba a la entidad.

    Ahora: La entidad genera el ID en su método create, y el caso de uso solo pasa los datos de negocio.

9.5.2. Creación Automática de la Ronda Inicial

Se modificó CreateCastingUseCase para que cree automáticamente la Ronda 1 al crear un casting. Esto resuelve el problema de que POST /api/v1/rounds/participants fallara porque round-1 no existía.

Flujo actual:

    El director crea un casting.

    El sistema crea automáticamente la Ronda 1 con la lista de participantes vacía.

    El director puede añadir participantes a la Ronda 1 mediante POST /api/v1/rounds/participants.

9.6. Gestión del Agente (OpenCode) y Documentación

Durante esta sesión, el agente demostró una capacidad excepcional para ejecutar refactorizaciones complejas:

    Refactor de TypedId: Eliminó TypedId en todas las capas (domain, application, infrastructure, tests) y sustituyó por strings planos.

    Refactor de Director: Unificó Director como Participant en el esquema de Prisma, en las entidades, en los casos de uso y en la API.

    Actualización de AGENTS.md: Documentó todos los cambios, creando copias de seguridad siguiendo la política establecida.

    Test Coverage: Todos los tests (181+) pasaron tras las refactorizaciones.

Este comportamiento confirma que el agente ha internalizado las reglas y patrones del proyecto, y es capaz de realizar tareas de refactorización de gran envergadura con mínima supervisión.
9.7. Resultados y Estado del Proyecto
Aspecto	Estado
Modelo de Usuarios	✅ Unificado (User + Participant)
Sistema de IDs	✅ Simplificado (strings con prefijos)
Caso de Uso	✅ 6 casos de uso implementados
API (Escritura)	✅ 6 endpoints
API (Lectura)	✅ 4 endpoints
Tests	✅ 181+ pasando
Cobertura	✅ Alta (≈99%)
Documentación	✅ AGENTS.md actualizado
9.8. Conclusión

La sesión de refactorización y consolidación ha culminado con un sistema más coherente, simple y mantenible. La eliminación de TypedId ha reducido la complejidad innecesaria, y la unificación del modelo de usuarios en Participant ha alineado el dominio con la realidad del negocio. La API está ahora completa, con todos los endpoints de lectura y escritura necesarios para el flujo completo de un casting.

El sistema está sólidamente fundamentado sobre principios de Clean Architecture y Domain-Driven Design, y preparado para futuras evoluciones.