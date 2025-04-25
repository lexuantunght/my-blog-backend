import bcrypt from 'bcryptjs';
import { singleton } from 'common/shared/module-container';
import Database from 'core/database';
import { AccountManager, UserInfoCreateParams, UserInfoModel } from 'features/account';
import SmartCache from 'utils/smart-cache';

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
			orderBy: ['id'],
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
}
