// domain/entities/Actor.ts

/**
 * @file Actor.ts
 * @module domain/entities
 */

import Email from '../value-objects/Email';
import FullName from '../value-objects/FullName';

export class Actor {
  private readonly _id: string;
  private readonly _name: FullName;
  private readonly _email: Email;
  private readonly _submissions: any[];

  private constructor(id: string, name: FullName, email: Email, submissions: any[]) {
    this._id = id;
    this._name = name;
    this._email = email;
    this._submissions = submissions;
  }

  /**
   * @static
   * @param {string} id - Unique identifier for the Actor.
   * @param {string} name - Name of the Actor.
   * @param {Email} email - Email address of the Actor.
   * @returns {Actor} - A new instance of Actor.
   */
  static create(id: string, name: FullName, email: Email): Actor {
    return new Actor(id, name, email, []);
  }

  /**
   * @returns {string} - Actor's unique identifier.
   */
  get id(): string {
    return this._id;
  }

  /**
   * @returns {string} - Actor's name.
   */
  get name(): FullName {
    return this._name;
  }

  /**
   * @returns {Email} - Actor's email address.
   */
  get email(): Email {
    return this._email;
  }

  /**
   * @param {any} submission - Submission to be added.
   * @returns {Actor} - A new instance of Actor with the additional submission.
   */
  addSubmission(submission: any): Actor {
    const newSubmissions = [...this._submissions, submission];
    return new Actor(this._id, this._name, this._email, newSubmissions);
  }

  /**
   * @returns {any[]} - Array of submissions (temporal).
   */
  get submissions(): any[] {
    return this._submissions;
  }
}

export default Actor;