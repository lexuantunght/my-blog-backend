import ModuleContainer from 'common/shared/module-container';
import AppConfig from 'config/app';
import { DatabaseToken } from './database';
import { DBTableAdapter } from './types';
import { UserInfo, UserInfoSchema } from './schema/user-info';
import { DBSQLiteTableAdapter } from './adapter/sqlite-adapter';
import { DBMongoTableAdapter } from './adapter/mongodb-adapter';

export class Database {
	private _UserInfo?: DBTableAdapter<UserInfo>;

	get UserInfo() {
		if (!this._UserInfo) {
			this._UserInfo = AppConfig.dbAdapterType
				? new DBMongoTableAdapter('UserInfo', UserInfoSchema)
				: new DBSQLiteTableAdapter('UserInfo', UserInfoSchema);
			this._UserInfo.open();
		}
		return this._UserInfo;
	}

	close() {
		return this._UserInfo?.close();
	}
}

ModuleContainer.registerSingleton(DatabaseToken, Database);
