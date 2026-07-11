// domain/entities/User.ts

/**
 * @file User.ts
 * @module domain/entities
 */

import { UserId } from '../value-objects/TypedId';
import Email from '../value-objects/Email';
import FullName from '../value-objects/FullName';

export class User {
  private readonly _id: UserId;
  private readonly _name: FullName;
  private readonly _email: Email;
  private readonly _submissions: any[];

  private constructor(id: UserId, name: FullName, email: Email, submissions: any[]) {
    this._id = id;
    this._name = name;
    this._email = email;
    this._submissions = submissions;
  }

  /**
   * @static
   * @param {UserId} id - Unique identifier for the User.
   * @param {FullName} name - Name of the User.
   * @param {Email} email - Email address of the User.
   * @returns {User} - A new instance of User.
   */
  static create(id: UserId, name: FullName, email: Email): User {
    return new User(id, name, email, []);
  }

  /**
   * @returns {UserId} - User's unique identifier.
   */
  get id(): UserId {
    return this._id;
  }

  /**
   * @returns {string} - User's name.
   */
  get name(): FullName {
    return this._name;
  }

  /**
   * @returns {Email} - User's email address.
   */
  get email(): Email {
    return this._email;
  }

  /**
   * @param {any} submission - Submission to be added.
   * @returns {User} - A new instance of User with the additional submission.
   */
  addSubmission(submission: any): User {
    const newSubmissions = [...this._submissions, submission];
    return new User(this._id, this._name, this._email, newSubmissions);
  }

  /**
   * @returns {any[]} - Array of submissions (temporal).
   */
  get submissions(): any[] {
    return this._submissions;
  }
}

export default User;

/**
 * @deprecated Use User instead. Will be removed in future versions.
 */
export const Actor = User;
export type Actor = User;
