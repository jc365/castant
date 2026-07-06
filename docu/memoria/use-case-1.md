"Crea el caso de uso CreateCastingUseCase en backend/src/application/use-cases/castings/CreateCastingUseCase.ts.

Debe:
    Importar Casting, CastingTitle, Description, ICastingRepository, IDirectorRepository (aunque no exista, usa IActorRepository como referencia) y los DTOs necesarios.
    Tener un constructor que reciba un repositorio de casting (y, opcionalmente, un repositorio de directores para validar que existe).
    El método execute debe recibir un DTO CreateCastingInput que contenga title, description y directorId.
    Validar que el director existe (si tienes repositorio de directores, si no, simplifica y solo valida que el ID no esté vacío por ahora).
    Crear los Value Objects CastingTitle y Description.
    Crear la entidad Casting con un ID generado (puedes usar EntityId.create<'Casting'>(crypto.randomUUID())).
    Guardar el casting usando el repositorio.
    Devolver el casting creado.

Genera también los tests unitarios para el caso de uso en tests/unit/application/use-cases/CreateCastingUseCase.test.ts. Los tests deben cubrir el caso feliz y el caso de error (ej. director no encontrado).

Sigue los patrones de CreateActorUseCase y las directrices de AGENTS.md." 