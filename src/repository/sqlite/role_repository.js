/*@flow*/

const assert = require('assert');

import type {IPrincipal}        from '../../domain/interface';
import type {IRealm}            from '../../domain/interface';
import type {IRole}             from '../../domain/interface';
import type {ClaimRepository}   from '../interface';
import type {RoleRepository}    from '../interface';
import type {RealmRepository}   from '../interface';
import {QueryOptions}           from '../interface';
import {Role}                   from '../../domain/role';
import {PersistenceError}       from '../persistence_error';
import {DBFactory}              from './db_factory';
import {QueryHelper}            from './query_helper';
import type {SecurityCache}     from '../../cache/interface';

/**
 * RoleRepositorySqlite implements RoleRepository by defining data
 * access methods for role objects
 */
export class RoleRepositorySqlite implements RoleRepository {
	dbFactory:          DBFactory;
	realmRepository:    RealmRepository;
	claimRepository:    ClaimRepository;
	cache:              SecurityCache;
	sqlPrefix:string;

	constructor(theDBFactory: DBFactory,
		theRealmRepository: RealmRepository,
		theClaimRepository: ClaimRepository,
		theCache: SecurityCache) {
		//
		assert(theDBFactory, 'db-helper not specified');
		assert(theRealmRepository, 'realm-repository not specified');
		assert(theClaimRepository, 'claim-repository not specified');
		assert(theCache, 'cache not specified');
		//
		this.dbFactory          = theDBFactory;
		this.realmRepository    = theRealmRepository;
		this.claimRepository    = theClaimRepository;
		this.cache              = theCache;
		this.sqlPrefix          = 'SELECT rowid AS id, realm_id, role_name FROM roles';
	}

	/**
	 * This method finds object by id
	 * @param {*} id - database id
	 */
	async findById(id: number): Promise<IRole> {
		assert(id, 'role-id not specified');

		let cached = this.cache.get('role', `id_${id}`);
		if (cached) {
			return cached;
		}
		//
		return new Promise((resolve, reject) => {
			this.dbFactory.db.get(`${this.sqlPrefix} WHERE rowid == ?`, id, (err, row) => {
				if (err) {
					reject(new PersistenceError(`Could not find role with id ${id}`));
				} else if (row) {
					this.__rowToRole(row).then(role => {
						resolve(role);
					});
				} else {
					reject(new PersistenceError(`Could not find role with id ${id}`));
				}
			});
		});
	}

	/**
	 * This method finds role by name
	 * @param {*} realmName
	 * @param {*} roleName
	 */
	async findByName(realmName: string, roleName: string): Promise<IRole> {
		assert(realmName, 'realm-name not specified');
		assert(roleName, 'role-name not specified');

		//
		let realm   = await this.realmRepository.findByName(realmName);
		return new Promise((resolve, reject) => {
				this.dbFactory.db.get(`${this.sqlPrefix} WHERE realm_id = ? AND role_name == ?`,
									  realm.id, roleName, (err, row) => {
					if (err) {
						reject(new PersistenceError(`Could not find role with name ${roleName}`));
					} else if (row) {
						this.__rowToRole(row).
						then(role => {
							resolve(role);
						});
					} else {
						reject(new PersistenceError(`Could not find role with name ${roleName}`));
					}
				});
			});
	}

	/**
	 * This method saves object and returns updated object
	 * @param {*} role - to save
	 */
	async save(role: IRole): Promise<IRole> {
		assert(role, 'role not specified');
		assert(role.realm && role.realm.id, 'realm not specified');
		this.cache.remove('role', `id_${role.id}`);

		//
		let loaded = null;
		if (!role.id && role.realm.realmName) {
			try {
				loaded = await this.findByName(role.realm.realmName, role.roleName);
				if (loaded) {
					role.id = loaded.id;
				}
			} catch (err) {
			}
		}
		//

		let savePromise = new Promise((resolve, reject) => {
			if (role.id) {
				if (loaded && loaded.roleName !== role.roleName) {
					let stmt = this.dbFactory.db.prepare('UPDATE roles SET role_name = ? WHERE rowid = ?');
					stmt.run(role.roleName, role.realm.id);
					stmt.finalize(err => {
						if (err) {
							reject(new PersistenceError(`Could not save role ${String(role)} due to ${err}`));
						} else {
							resolve(role);
						}
					});
				} else {
					resolve(role);
				}
			} else {
				let stmt = this.dbFactory.db.prepare('INSERT INTO roles VALUES (?, ?)');
				stmt.run(role.realm.id, role.roleName, function(err) {
					role.id = this.lastID;
				});
				stmt.finalize((err) => {
					if (err) {
						reject(new PersistenceError(`Could not add ${String(role)} due to ${err}`));
					} else {
						resolve(role);
					}
				});
			}
		});
		//
		await savePromise;
		await this.claimRepository.__saveRoleClaims(role);
		await this.__saveRoleParents(role);
		return savePromise;
	}

   /**
	 * This method adds set of roles as parent
	 */
	async __saveRoleParents(role: IRole): Promise<IRole> {
		assert(role, 'role not specified');
		assert(role.realm && role.realm.id, 'realm not specified');

		let savePromises = [];
		role.parents.forEach(parent => {
			if (!parent.id) {
				this.save(parent);
			}
		});
		await Promise.all(savePromises);
		//
		let deletePromise = new Promise((resolve, reject) => {
			this.dbFactory.db.run('DELETE FROM role_parents WHERE role_id = ? ',
			role.id, (err) => {
					if (err) {
						reject(new PersistenceError(`Failed to remove parent ${String(parent)} from ${String(role)} due to ${err}`));
					} else {
						resolve(role);
					}
			});
		});
		//
		await deletePromise;
		//
		let insertPromises = [];
		role.parents.forEach(parent => {
			if (parent.id != role.id) {
				insertPromises.push(new Promise((resolve, reject) => {
					this.dbFactory.db.run('INSERT INTO role_parents VALUES(?, ?) ',
					role.id, parent.id, (err) => {
						if (err) {
							reject(new PersistenceError(`Failed to add parent ${String(parent)} to ${String(role)} due to ${err}`));
						} else {
							resolve(role);
						}
					});
				}));
			}
		});
		await Promise.all(insertPromises);
		return role;
	}

	/**
	 * This method save role for principal
	 * @param {*} principal
	 * @param {*} roles
	 */
	async __savePrincipalRoles(principal: IPrincipal): Promise<IPrincipal> {
		assert(principal && principal.id, 'principal not specified');
		//
		let deletePromise = new Promise((resolve, reject) => {
			this.dbFactory.db.run('DELETE FROM principals_roles WHERE principal_id = ?',
			principal.id, (err) => {
					if (err) {
						reject(new PersistenceError(`Could not remove Role from principal ${String(principal)} due to ${err}`));
					} else {
						resolve();
					}
				});
		  });
		await deletePromise;

		//
		let savePromises = [];
		principal.roles.forEach(role => {
			this.cache.remove('role', `id_${role.id}`);
			savePromises.push(new Promise((resolve, reject) => {
			  this.dbFactory.db.run('INSERT INTO principals_roles VALUES (?, ?, ?, ?)',
				  principal.id, role.id, role.startDate.toISOString().split('T')[0], role.endDate.toISOString().split('T')[0], (err) => {
					  if (err) {
						  reject(new PersistenceError(`Could not add Role ${String(role)} to principal ${String(principal)} due to ${err}`));
					  } else {
						  principal.roles.add(role);
						  resolve(role);
					  }
				  });
			}));
		});
		await Promise.all(savePromises);
		return principal;
	}


	/**
	 * This method removes object by id
	 * @param {*} id - database id
	 */
	async removeById(id: number): Promise<boolean> {
		assert(id, 'role id not specified');
		//
		this.cache.remove('role', `id_${id}`);
		let promise = new Promise((resolve, reject) => {
			this.dbFactory.db.run('DELETE FROM principals_roles WHERE role_id = ?', id, (err) => {});
			this.dbFactory.db.run('DELETE FROM role_parents WHERE role_id = ?', id, (err) => {});
			this.dbFactory.db.run('DELETE FROM roles WHERE rowid = ?', id, (err) => {
				if (err) {
					reject(new PersistenceError(`Failed to remove role with id ${id} due to ${err}`));
				} else {
					this.cache.remove('role', `id_${id}`);
					resolve(true);
				}
			});
		});
		return await promise;
	}

	/**
	 * This method queries database and returns list of objects
	 */
	async search(criteria: Map<string, any>, options?: QueryOptions): Promise<Array<IRole>> {
		let q:QueryHelper<Role> = new QueryHelper(this.dbFactory.db);
		return q.query(this.sqlPrefix, criteria, (row) => {
			 return this.__rowToRole(row);
		 }, options);
	}

	/**
	 * This method loads roles for given principal
	 */
	async __loadPrincipalRoles(principal: IPrincipal): Promise<IPrincipal> {
		assert(principal && principal.id, 'principal not specified');
		//
		principal.roles.length = 0;
		let criteria: Map<string, any> = new Map();
		criteria.set('principal_id', principal.id);
		let q:QueryHelper<Role> = new QueryHelper(this.dbFactory.db);
		let claimPromises = [];

		await q.query(
					"SELECT principal_id, role_id, roles.rowid AS id, role_name, realm_id " +
					"FROM principals_roles INNER JOIN roles on roles.rowid = principals_roles.role_id" +
					" WHERE date('now') BETWEEN principals_roles.start_date and principals_roles.end_date",
					criteria, (row) => {
					return this.__rowToRole(row).
						then(role => {
						principal.roles.add(role);
						return role;
					});
		});
		principal.roles.forEach(role => {
			claimPromises.push(this.claimRepository.__loadRoleClaims(role));
		});
		await Promise.all(claimPromises);
		return principal;
	}


	 // This method loads parent roles
	async __loadParentRoles(role: IRole): Promise<Array<IRole>> {
		assert(role && role.id, 'role not specified');
		//
		let criteria: Map<string, any> = new Map();
		criteria.set('role_id', role.id);
		let q:QueryHelper<Role> = new QueryHelper(this.dbFactory.db);
		//
		return q.query(
				"SELECT parent_role_id, role_id, roles.rowid AS id, role_name, realm_id " +
				"FROM role_parents INNER JOIN roles on roles.rowid = role_parents.parent_role_id",
				criteria, (row) => {
				return this.__rowToRole(row).then(parent => {
						role.parents.add(parent);
								return parent;
				});
		});
	}

	async __rowToRole(row: any): Promise<IRole> {
		//
		let realm               = await this.realmRepository.findById(row.realm_id);
		let role                = new Role(realm, row.role_name);
		role.id                 = row.id;
		let promiseLoadParents  = await this.__loadParentRoles(role);
		let promiseLoadClaims   = await this.claimRepository.__loadRoleClaims(role);
		this.cache.set('role', `id_${role.id}`, role);
		return role;
	}
}
