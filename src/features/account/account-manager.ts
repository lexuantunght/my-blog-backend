import { define } from 'common/shared/module-container';
import { UserInfoCreateParams, UserInfoModel } from './models';

export interface AccountManager {
	createAccount(params: UserInfoCreateParams): Promise<UserInfoModel>;
}

export const AccountManager = define<AccountManager>('account-manager');
