import mongoose from 'mongoose';
import {
	DBDeleteOptions,
	DBEntityValue,
	DBInsertOptions,
	DBQueryOptions,
	DBTableAdapter,
	DBTableSchema,
	DBUpdateOptions,
} from '../types';
import AppConfig from 'config/app';
import DBMongoQueryBuilder from '../builder/mongodb-query-builder';

class MongoDBConnectionManager {
	private static instance?: MongoDBConnectionManager;
	private operations: Set<string>;
	private dbInstance: typeof mongoose | null;
	private constructor() {
		this.operations = new Set();
		this.dbInstance = null;
	}

	static get shared() {
		if (!this.instance) {
			this.instance = new MongoDBConnectionManager();
		}
		return this.instance;
	}

	requestOpen(name: string, callback: (err?: unknown) => void) {
		if (!this.operations.size) {
			if (!this.dbInstance) {
				mongoose.Promise = global.Promise;
				mongoose
					.connect(AppConfig.mongodb_url, {
						useNewUrlParser: true,
						useUnifiedTopology: true,
					} as {})
					.then((db) => {
						this.dbInstance = db;
						console.log('Connected to database ');
						callback();
					})
					.catch((err) => {
						console.error(`Error connecting to the database. \n${err}`);
						callback(err);
					});
			} else {
				callback();
			}
		} else {
			callback();
		}
		this.operations.add(name);
	}

	requestClose(name: string, callback: (err?: unknown) => void) {
		this.operations.delete(name);
		if (!this.operations.size) {
			this.dbInstance?.disconnect().then(callback).catch(callback);
			this.dbInstance = null;
		} else {
			callback();
		}
	}
}

function primitiveTypeToConstructor(type: string) {
	switch (type) {
		case 'string':
			return String;
		case 'boolean':
			return Boolean;
		case 'number':
			return Number;
		case 'json':
			return Object;
		default:
			return Object;
	}
}

export class DBMongoTableAdapter<T> implements DBTableAdapter<T> {
	private db;
	private dbName: string;
	private isOpened: boolean;
	private callQueue: Array<() => Promise<void>>;
	private isRunning: boolean;
	private queryBuilder: DBMongoQueryBuilder<T>;
	constructor(name: string, schema: DBTableSchema<T>) {
		this.isOpened = false;
		this.dbName = name;
		this.callQueue = [];
		this.isRunning = false;
		this.db = mongoose.model(
			this.dbName,
			new mongoose.Schema(
				Object.fromEntries(
					Object.entries<DBEntityValue>(schema)
						.filter(([k]) => k !== '_id' && k !== 'id')
						.map(([k, v]) => [k, primitiveTypeToConstructor(v.data.type)])
				),
				{
					timestamps: { createdAt: false, updatedAt: false },
					id: true,
					versionKey: false,
				}
			)
		);
		this.queryBuilder = new DBMongoQueryBuilder(name, schema);

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
			if (!this.isOpened) {
				MongoDBConnectionManager.shared.requestOpen(this.dbName, (err) => {
					if (err) {
						reject(err);
					} else {
						this.isOpened = true;
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}

	close() {
		return new Promise<void>((resolve, reject) => {
			if (this.isOpened) {
				this.isOpened = false;
				MongoDBConnectionManager.shared.requestClose(this.dbName, (err) => {
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

	async getAll(options: DBQueryOptions<T>) {
		const task = this.db.find(this.queryBuilder.createConditions(options.conditions));
		if (options.orderBy) {
			const sort = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
			task.sort(sort.map((s) => (Array.isArray(s) ? s : [s, 'asc'])) as [string, mongoose.SortOrder][]);
		}
		if (options.limit) {
			task.limit(options.limit);
		}
		if (options.selector) {
			const projection = Array.isArray(options.selector) ? options.selector : [options.selector];
			task.projection(Object.fromEntries(projection.map((k) => [k, 1])));
		}
		const items = await task;
		return items as T[];
	}

	async delete(options: DBDeleteOptions<T>) {
		const res = await this.getAll({ conditions: options.conditions });
		await this.db.deleteMany(this.queryBuilder.createConditions(options.conditions), { noResponse: false });
		return res as T[];
	}

	async update(options: DBUpdateOptions<T>) {
		await this.db.updateMany(this.queryBuilder.createConditions(options.conditions), options.updater);
		return this.getAll({ conditions: options.conditions });
	}

	async insert(options: DBInsertOptions<T>) {
		const res = await this.db.create(options.data);
		return res as T[];
	}
}
