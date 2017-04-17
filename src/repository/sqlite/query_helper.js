var sqlite3 =               require('sqlite3').verbose();
import {QueryOptions}       from '../interface';
import {PersistenceError}   from '../persistence_error';


/**
 * This class defines helper query methods.
 */
export class QueryHelper<T> {
    db: sqlite3.Database;

    constructor(theDB: sqlite3.Database) {
        this.db = theDB;
    }

    async query(
        prefixQuery: string,
        criteria: Map<string, any>,
        mapper: (row: any) => T,
        options: ?QueryOptions = null): Array<T> {
        //
        var query = criteria.size > 0 ? prefixQuery + ' WHERE 1=1' : prefixQuery;
        var params = [];
        criteria.forEach((v, k) => {
            query += ` AND ${k} = ?`;
            params.push(v);
        });
        //
        //console.log(`----querying ${JSON.stringify(params)} using ${query}`);

        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else if (rows && rows.length > 0) {
                    let result = [];
                    rows.forEach(row => {
                        mapper(row).then(obj => {
                            result.push(obj);
                            //console.log(`------query got ${JSON.stringify(row)} -- from ${query}`);
                            if (result.length == rows.length) {
                                resolve(result);
                            }
                        });
                    });
                } else {
                    resolve([]);
                }
            });
        });
    }
}
