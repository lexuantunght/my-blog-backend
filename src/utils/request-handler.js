export function requestHandler(req, res, next) {
	res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
	let body;
	try {
		body = JSON.parse(req.body);
	} catch (err) {
		body = req.body;
	}
	req.body = body;
	next();
}
