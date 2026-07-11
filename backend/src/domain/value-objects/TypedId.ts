/**
 * @file TypedId.ts
 * @module domain/value-objects
 *
 * Value Object genérico para IDs tipados.
 * Previene confusiones entre tipos de entidad
 * (ej. pasar ActorId donde se espera CastingId).
 *
 * Uso:
 *   type ActorId = EntityId<'Actor'>
 *   type CastingId = EntityId<'Casting'>
 */
export default class EntityId<T extends string> {
  private readonly _value: string;
  private readonly _tag: T;

  private constructor(value: string, tag: T) {
    this._value = value;
    this._tag = tag;
  }

  /**
   * Crea una nueva instancia de EntityId.
   * @param value - Valor del identificador.
   * @returns Una nueva instancia de EntityId<T>.
   * @throws {Error} Si el valor está vacío o solo contiene espacios.
   */
  static create<T extends string>(value: string): EntityId<T> {
    if (!value || value.trim().length === 0) {
      throw new Error('Id cannot be empty');
    }
    return new EntityId<T>(value.trim(), undefined as unknown as T);
  }

  /**
   * Devuelve el valor del identificador.
   */
  getValue(): string {
    return this._value;
  }

  /**
   * Compara si dos EntityId son iguales (mismo valor y mismo tag).
   */
  equals(other: EntityId<T>): boolean {
    return this._value === other._value && this._tag === other._tag;
  }

  /**
   * Valida que un string sea un id válido sin lanzar excepción.
   * @param value - Cadena a validar.
   */
  static isValid(value: string): boolean {
    return !!value && value.trim().length > 0;
  }
}

// ============================================
// IDs específicos del dominio
// ============================================

export type UserId = EntityId<'User'>;

/**
 * @deprecated Use UserId instead. Will be removed in future versions.
 */
export type ActorId = EntityId<'Actor'>;

export type DirectorId = EntityId<'Director'>;
export type CastingId = EntityId<'Casting'>;
export type RoundId = EntityId<'Round'>;
export type SubmissionId = EntityId<'Submission'>;
