# Capítulo 10: Unificación del Modelo de Participantes y Consolidación del Flujo de Rondas

## 10.1. Introducción

Durante esta sesión se abordó la unificación definitiva del modelo de roles en el sistema de casting. El objetivo principal fue eliminar la duplicación de tablas y lógica, consolidando toda la gestión de participantes (actores, preselectores y directores) en una única tabla `Participant`. Además, se simplificó el flujo de creación de nuevas rondas, eliminando un caso de uso redundante y centralizando la lógica en `ManageRoundParticipantsUseCase`.

## 10.2. Unificación del Modelo de Participantes

### 10.2.1. Estructura de Datos

Hasta ahora, el sistema gestionaba los roles de los usuarios en dos tablas separadas:
- `Participant` (para directores a nivel de casting)
- `RoundActor` (para actores y preselectores a nivel de ronda)

Esta duplicación generaba complejidad innecesaria y dificultaba la trazabilidad. Se decidió unificar todas las relaciones de roles en una única tabla `Participant`, que permite asociar un `User` a un `Casting` o a una `Round` con un `role` específico.

**Nuevo esquema de `Participant`:**

```prisma
model Participant {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  castingId String?  // Rol a nivel de casting (ej. director, reviewer)
  roundId   String?  // Rol a nivel de ronda (ej. actor, preselector)
  role      String   // 'director' | 'actor' | 'preselector' | 'reviewer'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, castingId, role])
  @@unique([userId, roundId, role])
}
```

10.2.2. Campos de Auditoría

Se añadieron campos createdAt y updatedAt a todas las tablas principales (User, Casting, Round, Submission, Participant). Esto permite:

    Trazabilidad: Saber cuándo se creó o modificó cada registro.

    Auditoría: Facilitar la identificación de problemas en el flujo de datos.

    Depuración: Rastrear cambios en el sistema durante pruebas y producción.

10.3. Simplificación del Flujo de Rondas
10.3.1. Eliminación de SelectActorsForNextRoundUseCase

El caso de uso SelectActorsForNextRoundUseCase se creó inicialmente para permitir al director seleccionar actores de una ronda y crear la siguiente. Sin embargo, su lógica se solapaba completamente con ManageRoundParticipantsUseCase, que ya permitía:

    Añadir actores y preselectores a una ronda existente.

    Crear una nueva ronda con un conjunto específico de actores (usando createNewRound: true).

Se eliminó SelectActorsForNextRoundUseCase y su endpoint asociado (POST /api/v1/rounds/select), unificando todo el flujo en POST /api/v1/rounds/participants.
10.3.2. Corrección del Comportamiento de createNewRound

Durante la consolidación se detectó un error en el comportamiento de createNewRound: la nueva ronda heredaba todos los participantes de la ronda anterior, incluyendo preselectores. Se corrigió la lógica para que, al crear una nueva ronda (createNewRound: true), solo se incluyan los actores especificados en la petición.

Código corregido (versión final):
typescript

const actorIds = await this.detectAndAddUsers(actorInputs);
const preselectorIds = await this.detectAndAddUsers(preselectorInputs);

if (createNewRound) {
  const newParticipants = this.buildParticipantEntries([], actorIds, 'actor');
  const newNumber = currentRound.number + 1;
  const newRound = Round.create(newNumber, currentRound.castingId, newParticipants);
  await this.roundRepository.save(newRound);
  return newRound;
}

const actorEntries = this.buildParticipantEntries(currentRound.participants, actorIds, 'actor');
const preselectorEntries = this.buildParticipantEntries(currentRound.participants, preselectorIds, 'preselector');

const updatedRound = Round.create(
  currentRound.number,
  currentRound.castingId,
  [...actorEntries, ...preselectorEntries],
  currentRound.id
);
await this.roundRepository.save(updatedRound);

10.4. Ampliación de la Cobertura de Tests

Para garantizar la robustez del sistema, se amplió la cobertura de tests con 7 nuevos tests unitarios y 4 nuevos tests de integración.
10.4.1. Nuevos Tests Unitarios
Test	Descripción
No duplicar actores	Añadir el mismo actor dos veces no duplica el registro.
No duplicar preselectores	Añadir el mismo preselector dos veces no duplica el registro.
Doble rol	Un usuario puede ser actor en una ronda y preselector en otra.
No heredar participantes	createNewRound empieza desde cero sin heredar participantes.
Crear usuarios nuevos	Los usuarios que no existen se crean automáticamente.
Error: solo preselectores	createNewRound con solo preselectores lanza error.
Error: ronda no encontrada	createNewRound con ronda inexistente lanza error.
10.4.2. Nuevos Tests de Integración
Test	Descripción
No duplicar actores (API)	Verifica que la API no duplica actores.
Doble rol (API)	Verifica que un usuario puede ser actor y preselector.
No heredar participantes (API)	Verifica que la nueva ronda no hereda participantes.
Flujo completo	Crear casting → añadir actores → enviar videos → crear nueva ronda con actores seleccionados → verificar que la nueva ronda solo tiene esos actores.
10.5. Actualización de la Documentación (AGENTS.md)

El archivo AGENTS.md se actualizó para reflejar:

    El modelo unificado Participant y los campos de auditoría.

    La eliminación de SelectActorsForNextRoundUseCase.

    El nuevo flujo de creación de rondas con createNewRound: true.

    Las nuevas reglas de testing.

10.6. Resultados

    Tests: 177 tests pasando (unitarios e integración).

    Cobertura: Alta, con especial énfasis en los casos borde y errores.

    Código: Eliminación de duplicación y simplificación del flujo.

    Documentación: Actualizada y alineada con el código.

10.7. Conclusión

La unificación del modelo de participantes y la consolidación del flujo de rondas ha simplificado el sistema, reducido la duplicación y mejorado la coherencia del modelo de datos. La corrección del comportamiento de createNewRound y la ampliación de la cobertura de tests han garantizado la robustez del sistema, preparándolo para futuras evoluciones.