/*@flow*/


/**
 * PersistenceError defines error that is thrown upon database operation fails
 */
export class PersistenceError extends Error {

    constructor(message: string) {
        super(message);
        //
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}