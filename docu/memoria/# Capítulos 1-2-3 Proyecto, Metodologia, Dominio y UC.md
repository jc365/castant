--

## 📝 Capítulos 1, 2 y 3 para tu Memoria

---

# Capítulo 1: Introducción al Proyecto y Planteamiento del TFM

## 1.1. Contexto y Motivación

El presente Trabajo de Fin de Máster (TFM) surge de la necesidad de explorar y demostrar el potencial de los asistentes de programación basados en inteligencia artificial en el desarrollo de software profesional. En particular, se busca evaluar cómo un agente de IA (OpenCode) puede participar activamente en el desarrollo de un sistema completo, siguiendo las directrices de una arquitectura limpia y mantenible, y manteniendo la coherencia con las especificaciones del proyecto.

La industria del software se enfrenta a un cambio de paradigma con la irrupción de los agentes de IA. Herramientas como GitHub Copilot, Cursor y OpenCode están transformando la forma en que los desarrolladores escriben código. Sin embargo, existe una brecha entre el uso anecdótico de estas herramientas (generación de snippets) y su integración real en flujos de trabajo profesionales.

Este TFM se propone explorar esa frontera: **utilizar un agente de IA (OpenCode) como asistente de desarrollo en un proyecto real, definiendo un conjunto de directrices (contenidas en `AGENTS.md`) que el agente debe seguir para generar código consistente y de calidad.**

## 1.2. Objetivos del Proyecto

### Objetivo Principal
Desarrollar un sistema de gestión de casting (selección de actores) utilizando un agente de IA (OpenCode) como asistente principal de desarrollo, siguiendo los principios de Clean Architecture y Domain-Driven Design (DDD).

### Objetivos Específicos
1.  **Diseñar un sistema de casting completo:** Con entidades como `Casting`, `Round`, `User`, `Participant` y `Submission`, que refleje el flujo de trabajo real de un proceso de selección de actores.
2.  **Definir un conjunto de directrices para el agente:** Crear y mantener un archivo `AGENTS.md` que contenga las reglas de arquitectura, los patrones de diseño y las convenciones de código que el agente debe seguir.
3.  **Implementar el sistema con el agente:** Utilizar OpenCode para generar el código de las diferentes capas del sistema (dominio, aplicación, infraestructura, API), revisando y validando el código generado.
4.  **Asegurar la calidad del software:** Implementar una suite de tests (unitarios e integración) con cobertura alta, y establecer un sistema de logging y auditoría.
5.  **Documentar el proceso y los resultados:** Analizar la efectividad del agente, las lecciones aprendidas y las limitaciones encontradas.

## 1.3. Alcance del Proyecto

El proyecto se centra en el desarrollo de un backend robusto y una API REST, con una interfaz web básica para pruebas funcionales. El sistema cubre todo el ciclo de vida de un casting:

1.  **Creación y gestión de usuarios:** Actores, preselectores y directores.
2.  **Creación de castings y rondas:** Un casting puede tener múltiples rondas.
3.  **Gestión de participantes:** Añadir actores y preselectores a las rondas.
4.  **Envío y revisión de videos:** Los actores envían videos, los directores los revisan y puntúan.
5.  **Selección de actores:** Los directores seleccionan actores para la siguiente ronda.

## 1.4. Estructura del Documento

La memoria se estructura en capítulos que reflejan el proceso de desarrollo:

- **Capítulos 1-3:** Introducción, objetivos, alcance y metodología.
- **Capítulos 4-6:** Configuración del entorno, implementación de la capa de dominio y aplicación.
- **Capítulos 7-9:** Consolidación de la API, refactorización del modelo de usuarios y evolución de la arquitectura.
- **Capítulos 10-12:** Unificación del modelo de participantes, auditoría, autenticación y gobernanza de la base de datos.
- **Capítulo 13:** Conclusiones y trabajo futuro.

---

# Capítulo 2: Metodología y Herramientas

## 2.1. Metodología de Desarrollo

El proyecto se ha desarrollado siguiendo un enfoque **iterativo y evolutivo**, con una fuerte interacción entre el desarrollador (humano) y el agente de IA (OpenCode). La metodología se ha basado en los siguientes principios:

1.  **Desarrollo Guiado por Especificaciones:** El archivo `AGENTS.md` actúa como la "constitución" del proyecto. Define las reglas de arquitectura, los patrones de diseño y las convenciones de código que el agente debe seguir.
2.  **Refactorización Continua:** El código se ha ido refinando a lo largo del proyecto, eliminando duplicaciones y mejorando la legibilidad, siempre con la ayuda del agente.
3.  **Pruebas como Contrato:** Se ha priorizado la creación de tests (unitarios e integración) para garantizar la estabilidad del sistema y permitir refactorizaciones seguras.
4.  **Documentación Viva:** `AGENTS.md` y `STATUS.md` se han mantenido actualizados como fuentes de verdad del proyecto.

## 2.2. Herramientas Utilizadas

### 2.2.1. Backend
- **Node.js + Express:** Framework para la API REST.
- **TypeScript:** Lenguaje de programación principal.
- **Prisma ORM:** Para la gestión de la base de datos (SQLite en desarrollo).
- **Pino:** Logger estructurado para logs técnicos y de negocio.
- **JWT (jsonwebtoken):** Para la autenticación.
- **bcrypt:** Para el hashing de contraseñas.
- **Vitest:** Framework de pruebas unitarias y de integración.
- **Supertest:** Para pruebas de endpoints HTTP.

### 2.2.2. Frontend (Playground)
- **React + Vite:** Para la interfaz de usuario.
- **Tailwind CSS v3:** Para el estilizado.
- **Axios:** Cliente HTTP para consumir la API del backend.
- **React Router DOM:** Para la navegación.

### 2.2.3. Agente de IA
- **OpenCode:** Agente de programación autónomo. Se ha utilizado en modo chat (Plan y Build) para generar y refactorizar código.

### 2.2.4. Base de Datos
- **SQLite:** Para el entorno de desarrollo y pruebas.
- **DBeaver:** Cliente visual para gestionar la base de datos.

## 2.3. Flujo de Trabajo con el Agente

El flujo de trabajo con OpenCode ha seguido este patrón:

1.  **Definición de la Tarea:** El desarrollador describe la tarea en un prompt claro y detallado.
2.  **Generación de Código:** OpenCode genera el código, siguiendo las directrices de `AGENTS.md`.
3.  **Revisión Humana:** El desarrollador revisa el código generado, comprueba que pasa los tests y, si es necesario, solicita correcciones.
4.  **Refinamiento:** Se repite el proceso hasta que el código es aceptable.
5.  **Documentación:** El agente actualiza `AGENTS.md` con los nuevos patrones o decisiones de diseño.

---

# Capítulo 3: Definición del Dominio y Casos de Uso

## 3.1. Análisis del Dominio

El sistema de casting se basa en los siguientes conceptos fundamentales:

- **Usuario (`User`):** Una persona que participa en el sistema. Puede tener diferentes roles (actor, preselector, director) en diferentes contextos.
- **Casting (`Casting`):** El proceso de selección de actores para un proyecto. Tiene un título, una descripción y una lista de participantes.
- **Ronda (`Round`):** Una fase del casting. Cada ronda tiene un número y una lista de participantes (actores y preselectores).
- **Participant:** Relación entre un `User` y un `Casting` o una `Round`, con un `role` específico (`actor`, `preselector`, `director`).
- **Submission:** Envío de un video por parte de un actor a una ronda.
- **Bitácora (`Bitacora`):** Registro de auditoría de todas las acciones de negocio.

## 3.2. Modelo de Datos (Prisma)

```prisma
model User {
  id        String   @id
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}

model Casting {
  id          String   @id
  title       String
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ...
}

model Round {
  id          String   @id
  number      Int
  castingId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // ...
}

model Participant {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  castingId String?  // Rol a nivel de casting (ej. director)
  roundId   String?  // Rol a nivel de ronda (ej. actor, preselector)
  role      String   // 'director' | 'actor' | 'preselector' | 'reviewer'
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Submission {
  id        String   @id
  actorId   String
  roundId   String
  videoUrl  String
  status    String   // 'pending' | 'reviewed' | 'selected' | 'rejected'
  score     Int?
  feedback  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // ...
}

model Bitacora {
  id         String   @id @default(cuid())
  timestamp  DateTime @default(now())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String   // 'submit_video' | 'review_submission' | 'create_casting' | ...
  details    Json?
  castingId  String?
  roundId    String?
  submissionId String?
}
```

## 3.3. Casos de Uso Principales

| Caso de Uso | Descripción |
|-------------|-------------|
| `CreateUserUseCase` | Registro de un nuevo usuario. |
| `LoginUseCase` | Autenticación de usuario y generación de JWT. |
| `CreateCastingUseCase` | Creación de un nuevo casting (con ronda inicial). |
| `ManageRoundParticipantsUseCase` | Gestión de participantes (actores, preselectores) en una ronda. |
| `SubmitVideoUseCase` | Envío de un video por parte de un actor a una ronda. |
| `ReviewSubmissionUseCase` | Revisión de un video por parte del director. |
| `SelectActorsForNextRoundUseCase` | Selección de actores para la siguiente ronda. |

## 3.4. Arquitectura

El sistema sigue los principios de **Clean Architecture**, con cuatro capas principales:

1.  **Domain:** Entidades y Value Objects (lógica de negocio pura).
2.  **Application:** Casos de uso e interfaces de repositorio.
3.  **Infrastructure:** Implementaciones concretas (Prisma, Express, logging).
4.  **Interfaces (API):** Controladores y rutas Express.

**Regla de dependencia:** Las dependencias apuntan hacia dentro. La capa de dominio no depende de ninguna otra.

---

**¿Qué te parece?** ¿Quieres ajustar algún detalle? 🚀