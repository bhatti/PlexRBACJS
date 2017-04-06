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

    query(
        prefixQuery: string, 
        criteria: Map<string, any>, 
        mapper: (row: any) => Promise<T>, 
        options: ?QueryOptions = null): Promise<Array<T>> {
        //
        var query = criteria.size > 0 ? prefixQuery + ' WHERE ' : prefixQuery;
        var params = [];
        criteria.forEach((v, k) => {
            if (Array.isArray(v)) {
                query += `${k} in (?) `;
            } else {
                query += `${k} = ? `;
            }
            params.push(v);
        });
        //
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.log(`---------->>>>>>>>>>>query ${query} failed due to ${err}`);
                    reject(err);
                } else if (rows) {
                    var resultPromises = [];
                    rows.forEach(row => {
                        let promise = mapper(row);
                        console.log(`----------!!!!query got ${JSON.stringify(row)}`);
                        resultPromises.push(promise);
                    });
                    return Promise.all(resultPromises).
                    then(result => {
                        resolve(result);
                    });
                } else {
                    resolve([]);
                }
            }); 
        });
    }
}
