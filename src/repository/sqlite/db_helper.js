/*@flow*/

var sqlite3 = require('sqlite3').verbose();
import  {QueryOptions}      from '../interface';

/**
 * DBHelper provides helper DB methods
 */
export class DBHelper {
    db: sqlite3.Database;

    constructor(dbName: string) {
        this.db = new sqlite3.Database(dbName);

        this.db.serialize(() => {
            // principal or subject that needs to be checked
            this.db.run('CREATE TABLE if not exists principals (realm_id INTEGER, principal_name TEXT)');
            this.db.run('CREATE UNIQUE INDEX principals_realms_ndx on principals (realm_id, principal_name)');

            // realm or domain of application
            this.db.run('CREATE TABLE if not exists realms (realm_name TEXT)');
            this.db.run('CREATE UNIQUE INDEX realms_ndx on realms (realm_name)');

            // role or function, roles are inheritable
            this.db.run('CREATE TABLE if not exists roles (realm_id INTEGER, parent_id INTEGER, role_name TEXT)');
            this.db.run('CREATE UNIQUE INDEX realms_roles_ndx on roles (realm_id, realm_name)');

            // join table to associate principals to roles
            this.db.run('CREATE TABLE if not exists principals_roles (principal_id INTEGER, role_id INTEGER)');
            this.db.run('CREATE UNIQUE INDEX principals_roles_ndx on roles (principal_id, role_id)');

            // claims to check
            this.db.run('CREATE TABLE if not exists claims (realm_id INTEGER, action TEXT, resource TEXT, condition TEXT)');
            this.db.run('CREATE UNIQUE INDEX claims_ndx on roles (realm_id, action, resource, condition)');

            // claims can be associated to roles, which are associated to principals
            this.db.run('CREATE TABLE if not exists roles_claims (role_id INTEGER, claim_id INTEGER)');
            this.db.run('CREATE UNIQUE INDEX roles_claims_ndx on roles (role_id, claim_id)');

            // claims can also be directly to principals (without roles)
            this.db.run('CREATE TABLE if not exists principals_claims (principal_id INTEGER, claim_id INTEGER)');
            this.db.run('CREATE UNIQUE INDEX principals_claims_ndx on roles (principal_id, claim_id)');
        });
    }

    close() {
        this.db.close();
    }

    query<T>(prefixQuery: string, criteria: Map<string, any>, options?: QueryOptions, mapper: (row: any) => T): Array<T> {
        var query = criteria.size > 0 ? prefixQuery + ' where ' : prefixQuery;
        var params = [];
        criteria.forEach((k, v) => {
            if (Array.isArray(v)) {
                query += `${k} in (?) `;
            } else {
                query += `${k} = ? `;
            }
            params.push(v);
        });
        var result = [];
        this.db.each(query, params, (err, row) => {
            if (!err && row) {
                result.push(mapper(row));
            }
        }); 
        return result;
    }
}
