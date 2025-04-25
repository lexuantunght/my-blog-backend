import { DBQueryOperations, DBQueryOptions, DBTableSchema } from '../types';

const OPERATOR_MAPPER: Record<DBQueryOperations, string> = {
	eq: '$eq',
	neq: '$neq',
	lt: '$lt',
	gt: '$gt',
	gte: '$gte',
	lte: '$lte',
};

class DBMongoQueryBuilder<T> {
	private tableName: string;
	private tableSchema: DBTableSchema<T>;
	constructor(tableName: string, schema: DBTableSchema<T>) {
		this.tableName = tableName;
		this.tableSchema = schema;
	}

	createConditions(conditions: DBQueryOptions<T>['conditions']) {
		if (!conditions) {
			return {};
		}
		const tokens: Record<string, unknown> = {};
		for (const kName in conditions) {
			conditions[kName]?.forEach((checker) => {
				Object.entries(checker).forEach(([operator, value]) => {
					const oprt = OPERATOR_MAPPER[operator as keyof typeof OPERATOR_MAPPER];
					tokens[kName === 'id' ? '_id' : kName] = { [oprt]: value };
				});
			});
		}
		return tokens;
	}
}

export default DBMongoQueryBuilder;
