import {
	DBTableSchema,
	DBDeleteOptions,
	DBInsertOptions,
	DBQueryOptions,
	DBUpdateOptions,
	DBQueryOperations,
	DBEntityValue,
} from '../types';

const OPERATOR_MAPPER: Record<DBQueryOperations, string> = {
	eq: '=',
	neq: '!=',
	lt: '<',
	gt: '>',
	gte: '>=',
	lte: '<=',
};

class DBSQLiteQueryBuilder<T> {
	private tableName: string;
	private tableSchema: DBTableSchema<T>;
	constructor(tableName: string, schema: DBTableSchema<T>) {
		this.tableName = tableName;
		this.tableSchema = schema;
	}

	private toValidArray<V>(value?: V | V[]) {
		return (Array.isArray(value) ? value : [value]).filter(Boolean) as V[];
	}

	private toValidValue<V>(col: keyof DBTableSchema<T>, value: V) {
		const { type } = this.tableSchema[col].data;
		switch (type) {
			case 'boolean':
				return value ? 1 : 0;
			case 'number':
				return value as number;
			case 'string':
				return `'${value}'`;
			case 'json':
				return `'${JSON.stringify(value)}'`;
			default:
				throw 'Invalid data type!';
		}
	}

	private createConditions(conditions: DBQueryOptions<T>['conditions']) {
		if (!conditions) {
			return '';
		}
		const tokens: string[] = [];
		for (const kName in conditions) {
			conditions[kName]?.forEach((checker) => {
				Object.entries(checker).forEach(([operator, value]) => {
					const oprt = OPERATOR_MAPPER[operator as keyof typeof OPERATOR_MAPPER];
					tokens.push(`${kName}${oprt}${this.toValidValue(kName, value)}`);
				});
			});
		}
		if (tokens.length > 0) {
			return 'WHERE ' + tokens.join(' AND ');
		}
		return '';
	}

	createQuery(options: DBQueryOptions<T>) {
		const { limit, conditions } = options;
		const selector = this.toValidArray(options.selector);
		const orderBy = this.toValidArray(options.orderBy);
		const tokens: string[] = [];
		tokens.push(`SELECT ${selector.length > 0 ? selector.join(',') : '*'} FROM ${this.tableName}`);
		if (conditions) {
			tokens.push(this.createConditions(conditions));
		}
		if (orderBy.length > 0) {
			tokens.push(`ORDER BY ${orderBy.join(',')}`);
		}
		if (typeof limit === 'number') {
			tokens.push(`LIMIT ${limit}`);
		}
		return tokens.join(' ');
	}

	createDelete(options: DBDeleteOptions<T>) {
		const { conditions } = options;
		const tokens: string[] = [`DELETE FROM ${this.tableName}`];
		if (conditions) {
			tokens.push(this.createConditions(conditions));
		}
		return tokens.join(' ');
	}

	createInsert(options: DBInsertOptions<T>) {
		const { data } = options;
		const tokens: string[] = [`INSERT INTO ${this.tableName}`];
		const columns = Object.keys(this.tableSchema) as Array<keyof T>;
		tokens.push(`(${columns.join(',')})`);
		tokens.push('VALUES');
		tokens.push(
			`${data.map((item) => `(${columns.map((col) => this.toValidValue(col, item[col])).join(',')})`).join(', ')}`
		);
		return tokens.join(' ');
	}

	createUpdate(options: DBUpdateOptions<T>) {
		const { updater, conditions } = options;
		const tokens: string[] = [`UPDATE ${this.tableName} SET`];
		for (const col in updater) {
			const value = updater[col];
			tokens.push(`${col}=${this.toValidValue(col, value)}`);
		}
		if (conditions) {
			tokens.push(this.createConditions(conditions));
		}
		return tokens.join(' ');
	}

	createDrop() {
		return 'DROP TABLE ' + this.tableName;
	}

	createInit() {
		const tokens = [`CREATE TABLE IF NOT EXISTS ${this.tableName}`];
		const columns: string[] = [];
		Object.entries<DBEntityValue>(this.tableSchema).forEach(([col, validator]) => {
			const { type, primaryKey, nullable } = validator.data;
			const dataType = type === 'number' || type === 'boolean' ? 'INTEGER' : 'TEXT';
			columns.push(`${col} ${dataType} ${primaryKey ? 'PRIMARY KEY' : ''} ${!nullable ? 'NOT NULL' : ''}`);
		});
		tokens.push(`(${columns.join(',')})`);
		return tokens.join(' ');
	}
}

export default DBSQLiteQueryBuilder;
