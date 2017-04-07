/*@flow*/


/**
 * AuthorizationError defines error that is thrown upon claim/permission fails
 */
export class AuthorizationError extends Error {
    principalName:  string;
    action:         string;
    resource:       string;
    context:        Map<string, any>;

    constructor(message: string, 
                thePrincipalName?: string = '',
                theAction?:string = '', 
                theResource?: string = '',
                theContext: Map<string, any> = new Map()) {
        //
        super(message);
        this.principalName = thePrincipalName;
        this.action = theAction;
        this.resource = theResource;
        this.context = theContext;
        //
        this.name = this.constructor.name;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}
