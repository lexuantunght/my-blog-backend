const jwt = require('jsonwebtoken');
import type { Express } from 'express';
import AppConfig from 'config/app';
import ModuleContainer from 'common/shared/module-container';
import { AccountManager, UserInfoModel } from 'features/account';
import ServerCommon from 'utils/common';
import Authorize from 'middleware/authorize';

export function registerAccountAPIs(app: Express) {
	app.post('/user/register', Authorize.verifyToken, async (req, res) => {
		if (ServerCommon.getUserFromRequest(req).username !== 'lexuantunght') {
			return res.status(403).send(ServerCommon.createResponse(400, null, 'Not allow'));
		}

		const invalid = Object.values(UserInfoModel.validate(req.body)).find(Boolean);
		if (invalid) {
			return res.status(400).send(ServerCommon.createResponse(400, null, invalid));
		}
		ModuleContainer.resolve(AccountManager)
			.createAccount(req.body)
			.then((user) => {
				ServerCommon.deleteProp(user, 'password');
				res.send(ServerCommon.createResponse(200, user, 'register ok'));
			})
			.catch((err) => {
				res.status(400).send(ServerCommon.createResponse(400, null, err.message));
			});
	});

	app.post('/user/login', async (req, res) => {
		const accountManager = ModuleContainer.resolve(AccountManager);
		accountManager
			.authenticate(req.body.username, req.body.password)
			.then((user) => {
				const client_sek = accountManager.getClientKey(user);
				const token = jwt.sign({ id: user.id }, ServerCommon.md5(AppConfig.clientSEK), {
					expiresIn: 86400 * 1000 * 7,
				});
				ServerCommon.deleteProp(user, 'password');
				res
					.cookie('x-access-token', token, {
						maxAge: 86400 * 1000 * 7,
						sameSite: 'none',
						secure: true,
						httpOnly: true,
					})
					.send(ServerCommon.createResponse(200, { ...user, client_sek }, 'login ok'));
			})
			.catch((err) => {
				res.status(401).send(ServerCommon.createResponse(401, null, err.message));
			});
	});

	app.get('/user/current', Authorize.verifyToken, (req, res) => {
		const user = ServerCommon.getUserFromRequest(req);
		const client_sek = ModuleContainer.resolve(AccountManager).getClientKey(user);
		ServerCommon.deleteProp(user, 'password');
		res.status(200).send(ServerCommon.createResponse(200, { ...user, client_sek }, ''));
	});
}
