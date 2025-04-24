import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import {
	DBDeleteOptions,
	DBInsertOptions,
	DBQueryOptions,
	DBTableAdapter,
	DBTableSchema,
	DBUpdateOptions,
} from '../types';
import DBSQLiteQueryBuilder from '../builder/sqlite-query-builder';

export class DBSQLiteTableAdapter<T> implements DBTableAdapter<T> {
	private db!: sqlite3.Database;
	private dbName: string;
	private queryBuilder: DBSQLiteQueryBuilder<T>;
	private isOpened: boolean;
	private callQueue: Array<() => Promise<void>>;
	private isRunning: boolean;
	constructor(name: string, schema: DBTableSchema<T>) {
		this.isOpened = false;
		this.dbName = name;
		this.callQueue = [];
		this.isRunning = false;
		this.queryBuilder = new DBSQLiteQueryBuilder(name, schema);

		this.open = this.withQueue(this.open.bind(this));
		this.close = this.withQueue(this.close.bind(this));
		this.getAll = this.withQueue(this.getAll.bind(this));
		this.delete = this.withQueue(this.delete.bind(this));
		this.update = this.withQueue(this.update.bind(this));
		this.insert = this.withQueue(this.insert.bind(this));
	}

	private dequeueTask() {
		const task = this.callQueue.shift();
		if (task) {
			task().finally(() => {
				this.dequeueTask();
			});
		} else {
			this.isRunning = false;
		}
	}

	private enqueueTask(fn: () => Promise<void>) {
		this.callQueue.push(fn);
		if (!this.isRunning) {
			this.isRunning = true;
			this.dequeueTask();
		}
	}

	private withQueue<T>(fn: (...args: any[]) => Promise<T>) {
		const wrapper = (...args: any[]) => {
			return new Promise<T>((resolve, reject) => {
				this.enqueueTask(() => fn(...args).then(resolve, reject));
			});
		};
		return wrapper;
	}

	open() {
		return new Promise<void>((resolve, reject) => {
			if (!this.db) {
				const dbPath = path.join(process.cwd(), 'databases');
				const createDB = (onsuccess: CallableFunction, onerror: CallableFunction) =>
					new sqlite3.Database(
						path.join(dbPath, `${this.dbName}.db`),
						sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
						(err) => {
							if (err) {
								onerror(err);
							} else {
								this.db.run(this.queryBuilder.createInit(), (err) => {
									if (err) {
										onerror(err);
									} else {
										this.isOpened = true;
										onsuccess();
									}
								});
							}
						}
					);
				if (!fs.existsSync(dbPath)) {
					fs.mkdir(dbPath, (err) => {
						if (err) {
							reject(err);
						} else {
							this.db = createDB(resolve, reject);
						}
					});
				} else {
					this.db = createDB(resolve, reject);
				}
			} else {
				resolve();
			}
		});
	}

	close() {
		return new Promise<void>((resolve, reject) => {
			if (this.isOpened) {
				this.isOpened = false;
				this.db.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}

	getAll(options: DBQueryOptions<T>) {
		return new Promise<T[]>((resolve, reject) => {
			const rows: T[] = [];
			this.db.each(
				this.queryBuilder.createQuery(options),
				(_err, row) => {
					rows.push(row as T);
				},
				(err) => {
					if (err) {
						reject(err);
					} else {
						resolve(rows);
					}
				}
			);
		});
	}

	delete(options: DBDeleteOptions<T>) {
		return new Promise<void>((resolve, reject) => {
			this.db.run(this.queryBuilder.createDelete(options), (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	update(options: DBUpdateOptions<T>) {
		return new Promise<void>((resolve, reject) => {
			this.db.run(this.queryBuilder.createUpdate(options), (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}

	insert(options: DBInsertOptions<T>) {
		return new Promise<void>((resolve, reject) => {
			this.db.run(this.queryBuilder.createInsert(options), (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}
}
