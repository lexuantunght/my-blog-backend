import { DBEntityValue, DBTableSchema } from '../types';

export interface UserInfo {
	id: string;
	name: string;
	email: string;
	username: string;
	password: string;
}

export const UserInfoSchema: DBTableSchema<UserInfo> = {
	id: DBEntityValue.string().primaryKey(),
	name: DBEntityValue.string(),
	email: DBEntityValue.string(),
	username: DBEntityValue.string(),
	password: DBEntityValue.string(),
};
