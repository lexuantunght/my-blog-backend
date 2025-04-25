import * as Yup from 'yup';
import type { UserInfo } from 'core/database/schema/user-info';

interface IUserInfoProps {
	id: string;
	name: string;
	email?: string;
	username: string;
	password: string;
}

export type UserInfoCreateParams = Omit<IUserInfoProps, 'id'>;

export class UserInfoModel implements IUserInfoProps {
	id: string;
	name: string;
	email?: string;
	username: string;
	password: string;
	private static schema: Yup.Schema;
	constructor({ id, name, email, username, password }: IUserInfoProps) {
		this.id = id;
		this.name = name;
		this.email = email;
		this.username = username;
		this.password = password;
	}

	static initFromEntity(entity: UserInfo) {
		return new UserInfoModel({
			id: entity.id,
			name: entity.name,
			email: entity.email,
			username: entity.username,
			password: entity.password,
		});
	}

	static validate(value: unknown) {
		if (!this.schema) {
			this.schema = Yup.object().shape({
				name: Yup.string().required(),
				username: Yup.string().min(3).max(128).required(),
				password: Yup.string().min(6).max(128),
			});
		}
		try {
			this.schema.validateSync(value);
			return {};
		} catch (err) {
			const error = err as Yup.ValidationError;
			return { [error.path || error.name]: error.errors[0] };
		}
	}
}
