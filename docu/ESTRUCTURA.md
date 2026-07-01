## 1. Estructura de Carpetas (Clean Architecture)

backend/
├── src/
│ ├── domain/ # Capa de Entidades (Core)
│ │ ├── entities/ # Objetos de negocio
│ │ │ ├── Actor.ts
│ │ │ ├── Director.ts
│ │ │ ├── Casting.ts
│ │ │ ├── Round.ts
│ │ │ └── Submission.ts
│ │ └── value-objects/ # (Opcional) Objetos de valor
│ │ └── Email.ts
│ ├── application/ # Capa de Casos de Uso
│ │ ├── use-cases/ # Lógica de negocio
│ │ │ ├── castings/
│ │ │ │ ├── CreateCastingUseCase.ts
│ │ │ │ └── ListCastingsUseCase.ts
│ │ │ ├── rounds/
│ │ │ │ ├── SelectActorsForNextRoundUseCase.ts
│ │ │ │ └── GetRoundDetailsUseCase.ts
│ │ │ └── submissions/
│ │ │ ├── SubmitVideoUseCase.ts
│ │ │ └── ReviewSubmissionUseCase.ts
│ │ └── interfaces/ # Interfaces de repositorios (puertos)
│ │ ├── IActorRepository.ts
│ │ ├── ICastingRepository.ts
│ │ ├── IRoundRepository.ts
│ │ └── ISubmissionRepository.ts
│ ├── interfaces/ # Capa de Adaptadores (Entrada)
│ │ └── api/ # Adaptadores HTTP
│ │ ├── routes/ # Controladores Express
│ │ │ ├── castingRoutes.ts
│ │ │ ├── roundRoutes.ts
│ │ │ └── submissionRoutes.ts
│ │ └── schemas/ # DTOs y validación (Zod)
│ │ ├── CreateCastingDTO.ts
│ │ ├── SubmitVideoDTO.ts
│ │ └── SelectActorsDTO.ts
│ └── infrastructure/ # Capa de Adaptadores (Salida)
│ ├── persistence/ # Implementaciones de repositorios
│ │ ├── PrismaActorRepository.ts
│ │ ├── PrismaCastingRepository.ts
│ │ ├── PrismaRoundRepository.ts
│ │ └── PrismaSubmissionRepository.ts
│ └── api/ # Clientes para servicios externos
│ ├── StorageService.ts # Subida de archivos
│ └── NotificationService.ts # Emails/notificaciones
├── tests/
│ ├── unit/ # Tests unitarios (casos de uso, entidades)
│ └── integration/ # Tests de integración (API)
└── package.json
text


## 2. Reglas de Dependencia
- **domain/** NO puede importar nada de `application/`, `interfaces/` o `infrastructure/`.
- **application/** puede importar de `domain/` y de `application/interfaces/`.
- **interfaces/** puede importar de `application/` y `domain/`.
- **infrastructure/** puede importar de todo (implementa las interfaces).

## 3. Convenciones de Nomenclatura
- **En general, todos los objetos, metodos, funciones, mensajes UI, ... van en ingles.**
- **Entidades (domain/entities/):** `Actor`, `Director`, `Casting`, `Round`, `Submission`.
- **Casos de uso (application/use-cases/):** `CreateCastingUseCase`, `SelectActorsForNextRoundUseCase`.
- **Interfaces de repositorios (application/interfaces/):** `IActorRepository`, `ICastingRepository`.
- **Controladores (interfaces/api/routes/):** `CastingController`, `RoundController`.
- **DTOs (interfaces/api/schemas/):** `CreateCastingDTO`, `SubmitVideoDTO`.
- **Implementaciones (infrastructure/persistence/):** `PrismaActorRepository`.