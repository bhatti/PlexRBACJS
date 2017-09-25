/*@flow*/

var sqlite3 =               require('sqlite3').verbose();
import {QueryOptions}       from '../interface';
import {PersistenceError}   from '../persistence_error';
/**
 * DBFactory provides helper DB methods
 * See https://github.com/mapbox/node-sqlite3/wiki
 */
export class DBFactory {
    db: sqlite3.Database;

    constructor(path: string) {
        this.db = new sqlite3.Database(path);
    }

    createTables(doneCB: () => void) {
        let createStmts = [
            'CREATE TABLE if not exists realms (realm_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(realm_name))',
            'CREATE TABLE if not exists principals (realm_id INT, principal_name TEXT, properties TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(realm_id, principal_name))',
            'CREATE TABLE if not exists roles (realm_id INT, role_name TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(realm_id, role_name))',
            'CREATE TABLE if not exists role_parents (role_id INT, parent_role_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(role_id, parent_role_id))',
            'CREATE TABLE if not exists claims (realm_id INT, action TEXT, resource TEXT, condition TEXT, effect TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(realm_id, action, resource, condition))',
            'CREATE TABLE if not exists audit_records (realm_id INT, principal_name, type TEXT, action TEXT, resource TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
            'CREATE TABLE if not exists principals_roles (principal_id INT, role_id INT, start_date TEXT, end_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(principal_id, role_id))',
            'CREATE TABLE if not exists roles_claims (role_id INT, claim_id INT, start_date TEXT, end_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(role_id, claim_id))',
            'CREATE TABLE if not exists principals_claims (principal_id INT, claim_id INT, start_date TEXT, end_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(principal_id, claim_id))',
            'CREATE TABLE if not exists limits (principal_id INT, type TEXT, resource TEXT, max_allowed INT, value INT, expiration_date TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
        ];
        let indexStmts = [
            'CREATE UNIQUE INDEX realms_ndx on realms (realm_name)',
            'CREATE UNIQUE INDEX principals_realms_ndx on principals (realm_id, principal_name)',
            'CREATE UNIQUE INDEX principals_roles_ndx on principals_roles(principal_id, role_id)',
            'CREATE UNIQUE INDEX role_parents_ndx on role_parents(role_id, parent_role_id)',
            'CREATE UNIQUE INDEX claims_ndx on claims(realm_id, action, resource, condition)',
            'CREATE INDEX limit_ndx on limits(principal_id)',
            'CREATE UNIQUE INDEX roles_claims_ndx on roles_claims(role_id, claim_id)',
            'CREATE UNIQUE INDEX principals_claims_ndx on principals_claims(principal_id, claim_id)'
        ];
        //
        DBFactory.__execAllAsync(this.db, createStmts, indexStmts).then(results => {
            doneCB();
        });
    }

    dropTables(doneCB: () => void) {
        let dropStmts = [
            'DROP TABLE if not exists principals',
            'DROP TABLE if not exists realms',
            'DROP TABLE if not exists roles',
            'DROP TABLE if not exists role_parents',
            'DROP TABLE if not exists principals_roles',
            'DROP TABLE if not exists claims',
            'DROP TABLE if not exists roles_claims',
            'DROP TABLE if not exists principals_claims',
            'DROP TABLE if not exists limits',
            'DROP TABLE if not exists audit_records',
            'DROP INDEX principals_realms_ndx',
            'DROP INDEX realms_ndx',
            'DROP INDEX realms_roles_ndx',
            'DROP INDEX principals_roles_ndx',
            'DROP INDEX claims_ndx',
            'DROP INDEX roles_claims_ndx',
            'DROP INDEX role_parents_ndx',
            'DROP INDEX principals_claims_ndx'
            ];
        DBFactory.__execAllAsync(this.db, dropStmts).then(results => {
            doneCB();
        });
    }

    static __execAllAsync(db, stmts, nextStmts) {
        let promises = [];
        stmts.forEach(stmt => {
            promises.push(DBFactory.__execAsync(db, stmt));
        });

        return Promise.all(promises).
            then(results => {
            if (nextStmts) {
                return DBFactory.__execAllAsync(db, nextStmts, null);
            }
        }).
            catch(err => {
            console.log(`!!!!Async statements failed due to ${err}!!!!`);
        });
    }

    static __execAsync(db, stmt) {
        return new Promise((resolve, reject) => {
            db.run(stmt, (err) => {
                if (err) {
                    reject(new PersistenceError(`failed to execute ${stmt} due to ${err}`));
                } else {
                    resolve(stmt);
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}
