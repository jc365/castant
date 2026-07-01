/**
 * @file Casting.ts
 * @module domain/entities
 */

export default class Casting {
  private _id: string;
  private _title: string;
  private _description: string;
  private _directorId: string;
  private _rounds: any[];

  private constructor(id: string, title: string, description: string, directorId: string) {
    if (!title.trim()) {
      throw new Error('Title cannot be empty');
    }
    this._id = id;
    this._title = title;
    this._description = description;
    this._directorId = directorId;
    this._rounds = [];
  }

  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get description(): string {
    return this._description;
  }

  public get directorId(): string {
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

