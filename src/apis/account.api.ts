import type { Express } from 'express';
import ModuleContainer from 'common/shared/module-container';
import { AccountManager, UserInfoModel } from 'features/account';
import ServerCommon from 'utils/common';

export function registerAccountAPIs(app: Express) {
	app.post('/user/register', async (req, res) => {
		const invalid = Object.values(UserInfoModel.validate(req.body)).find(Boolean);
		if (invalid) {
			return res.status(400).send(ServerCommon.createResponse(400, null, invalid));
		}
		ModuleContainer.resolve(AccountManager)
			.createAccount(req.body)
			.then((user) => {
				user.password = '';
				res.send(ServerCommon.createResponse(200, user, 'register ok'));
			})
			.catch((err) => {
				res.status(400).send(ServerCommon.createResponse(400, null, err.message));
			});
	});
}
