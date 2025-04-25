const bcrypt = require('bcryptjs');
import { singleton } from 'common/shared/module-container';
import Database from 'core/database';
import { AccountManager, UserInfoCreateParams, UserInfoModel } from 'features/account';
import SmartCache from 'utils/smart-cache';
import AppConfig from 'config/app';
import ServerCommon from 'utils/common';

@singleton(AccountManager)
export class AccountManagerImpl implements AccountManager {
	private cache: SmartCache<string, UserInfoModel>;
	constructor() {
		this.cache = new SmartCache({ maxSize: 1000, maxAge: 12 * 3600 * 1000 });
	}

	async createAccount(params: UserInfoCreateParams) {
		const DB = Database.getInstance();
		const users = await DB.UserInfo.getAll({
			conditions: { username: [{ eq: params.username }] },
			limit: 1,
			selector: ['username'],
		});
		if (users.length > 0) {
			throw Error('username already used');
		}
		const [user] = await DB.UserInfo.insert({
			data: [
				{
					name: params.name,
					email: params.email,
					username: params.username,
					password: bcrypt.hashSync(params.password, 8),
				},
			],
		});
		const userInfo = UserInfoModel.initFromEntity(user);
		this.cache.set(userInfo.id, userInfo);

		return userInfo;
	}

	async authenticate(username: string, password: string) {
		const DB = Database.getInstance();
		const [user] = await DB.UserInfo.getAll({
			conditions: { username: [{ eq: username }] },
			limit: 1,
		});
		if (!user || !bcrypt.compareSync(password, user.password)) {
			throw Error('username or password wrong');
		}
		const userInfo = UserInfoModel.initFromEntity(user);
		this.cache.set(userInfo.id, userInfo);

		return userInfo;
	}

	getClientKey(user: UserInfoModel) {
		return ServerCommon.md5(user.id + AppConfig.clientSEK + user.password);
	}

	async getUserById(id: string) {
		let userInfo = this.cache.get(id);
		if (userInfo) {
			return userInfo;
		}

		const DB = Database.getInstance();
		const [user] = await DB.UserInfo.getAll({
			conditions: { id: [{ eq: id }] },
			limit: 1,
		});
		if (user) {
			userInfo = UserInfoModel.initFromEntity(user);
			this.cache.set(userInfo.id, userInfo);
			return userInfo;
		}
	}
}
