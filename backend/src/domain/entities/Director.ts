// domain/entities/Director.ts

/**
 * @file Director.ts
 * @module domain/entities
 */

import  Email  from '../value-objects/Email';

export default class Director {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _email: Email;

  /**
   * Private constructor for Director entity.
   * @private
   */
  private constructor(id: string, name: string, email: Email) {
    this._id = id;
    this._name = name;
    this._email = email;
  }

  /**
   * Static method to create a new Director instance.
   * @param {string} id - The unique identifier for the Director.
   * @param {string} name - The name of the Director. Must not be empty.
   * @param {Email} email - The email object representing the Director's email address.
   * @returns {Director} A new instance of Director.
   */
  static create(id: string, name: string, email: Email): Director {
    if (name === '') {
      throw new Error('Name cannot be empty');
    }
    return new Director(id, name, email);
  }

  /**
   * Gets the ID of the Director.
   * @returns {string} The unique identifier for the Director.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Gets the name of the Director.
   * @returns {string} The name of the Director.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Gets the email object representing the Director's email address.
   * @returns {Email} The email object for the Director.
   */
  get email(): Email {
    return this._email;
  }
}

