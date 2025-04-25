import ServerCommon from 'utils/common';

export function errorHandler(err, req, res) {
	console.error(err.stack);
	const error_code = err.code || err.errorCode || err.error_code || 500;
	res.status(error_code).send(ServerCommon.createResponse(error_code, null, err.message));
}
