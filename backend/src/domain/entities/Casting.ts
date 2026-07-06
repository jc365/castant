/**
 * @file Casting.ts
 * @module domain/entities
 */

import CastingTitle from '../value-objects/CastingTitle';
import Description from '../value-objects/Description';
import { CastingId, DirectorId } from '../value-objects/TypedId';

export default class Casting {
  private _id: CastingId;
  private _title: CastingTitle;
  private _description: Description;
  private _directorId: DirectorId;
  private _rounds: any[];

  private constructor(id: CastingId, title: CastingTitle, description: Description, directorId: DirectorId) {
    this._id = id;
    this._title = title;
    this._description = description;
    this._directorId = directorId;
    this._rounds = [];
  }

  /**
   * Crea una nueva instancia de Casting.
   */
  static create(id: CastingId, title: CastingTitle, description: Description, directorId: DirectorId): Casting {
    return new Casting(id, title, description, directorId);
  }

  public get id(): CastingId {
    return this._id;
  }

  public get title(): string {
    return this._title.getValue();
  }

  public get description(): string {
    return this._description.getValue();
  }

  public get directorId(): DirectorId {
    return this._directorId;
  }

  public get rounds(): any[] {
    return [...this._rounds];
  }

  public addRound(round: any): Casting {
    const newCasting = new Casting(this._id, this._title, this._description, this._directorId);
    newCasting._rounds = [...this._rounds, round];
    return newCasting;
  }
}

