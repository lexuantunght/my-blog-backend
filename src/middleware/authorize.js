const jwt = require('jsonwebtoken');
import ModuleContainer from 'common/shared/module-container';
import AppConfig from 'config/app';
import { AccountManager } from 'features/account';
import ServerCommon from 'utils/common';

function _getUidFromToken(req) {
	return new Promise((resolve, reject) => {
		const token = req.query.token || req.cookies['x-access-token'] || req.headers['x-access-token'];
		if (!token) {
			reject();
		} else {
			jwt.verify(token, ServerCommon.md5(AppConfig.clientSEK), (err, decoded) => {
				if (err) {
					reject(err);
				} else {
					resolve(decoded.id);
				}
			});
		}
	});
}

async function verifyToken(req, res, next) {
	try {
		const uid = await _getUidFromToken(req);
		if (!uid) {
			throw Error('No uid found');
		}
		const user = await ModuleContainer.resolve(AccountManager).getUserById(uid);
		if (!user) {
			throw Error('No user found');
		}
		req.user = user;
		req.userId = uid;
	} catch {}
	if (req.user && req.userId) {
		next();
	} else {
		res.status(403).send(ServerCommon.createResponse(403, null, 'Unauthorized'));
	}
}

export default {
	_getUidFromToken,
	verifyToken,
};
