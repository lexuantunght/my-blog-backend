export type DBTableSchema<T> = { [K in keyof T]: DBEntityValue };

type DBQueryConditions<V> = Partial<Record<DBQueryOperations, V>>;

export type DBQueryOperations = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte';

export type DBQueryOptions<T> = Partial<{
	selector: Array<keyof T> | keyof T;
	limit: number;
	orderBy: Array<keyof T> | keyof T | Array<[keyof T, 'asc' | 'desc']>;
	conditions: Partial<{ [K in keyof T]: Array<DBQueryConditions<T[K]>> }>;
}>;

export type DBDeleteOptions<T> = {
	conditions?: Partial<{ [K in keyof T]: Array<DBQueryConditions<T[K]>> }>;
};

export type DBInsertOptions<T> = {
	data: Array<Partial<T>>;
};

export type DBUpdateOptions<T> = {
	updater: { [K in keyof T]: T[K] };
	conditions?: Partial<{ [K in keyof T]: Array<DBQueryConditions<T[K]>> }>;
};

export interface DBTableAdapter<T> {
	getAll(options: DBQueryOptions<T>): Promise<T[]>;
	delete(options: DBDeleteOptions<T>): Promise<T[]>;
	update(options: DBUpdateOptions<T>): Promise<T[]>;
	insert(options: DBInsertOptions<T>): Promise<T[]>;
	open(): Promise<void>;
	close(): Promise<void>;
}

export class DBEntityValue {
	private _type;
	private _nullable: boolean;
	private _primaryKey: boolean;
	private constructor(type: 'string' | 'number' | 'json' | 'boolean') {
		this._type = type;
		this._nullable = false;
		this._primaryKey = false;
	}

	static string() {
		return new DBEntityValue('string');
	}

	static number() {
		return new DBEntityValue('number');
	}

	static json() {
		return new DBEntityValue('json');
	}

	static boolean() {
		return new DBEntityValue('boolean');
	}

	nullable() {
		this._nullable = true;
		return this;
	}

	required() {
		this._nullable = false;
		return this;
	}

	primaryKey() {
		this._primaryKey = true;
		return this;
	}

	get data() {
		return { type: this._type, nullable: this._nullable, primaryKey: this._primaryKey };
	}
}
