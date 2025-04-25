import { define } from 'common/shared/module-container';
import { UserInfoCreateParams, UserInfoModel } from './models';

export interface AccountManager {
	createAccount(params: UserInfoCreateParams): Promise<UserInfoModel>;
	authenticate(username: string, password: string): Promise<UserInfoModel>;
	getClientKey(user: UserInfoModel): string;
	getUserById(id: string): Promise<UserInfoModel | undefined>;
}

export const AccountManager = define<AccountManager>('account-manager');
