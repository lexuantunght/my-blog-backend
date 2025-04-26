import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from 'http';
import path from 'path';
import 'express-async-errors';
import { requestHandler } from 'utils/request-handler';
import { registerAPIs } from 'apis';
import AppConfig from 'config/app';

export function main() {
	const app = express();

	app.use(
		cors({
			credentials: true,
			origin: AppConfig.allowOrigins,
		})
	);

	// parse requests of content-type - application/json
	app.use(bodyParser.text()).use(bodyParser.json());

	app.use(cookieParser());

	// parse requests of content-type - application/x-www-form-urlencoded
	app.use(bodyParser.urlencoded({ extended: true }));

	//public folder
	app.use('/static', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '30d' }));
	app.use('/', express.static(path.join(process.cwd(), 'public')));

	// apis
	app.use(requestHandler);
	registerAPIs(app);
	//app.use(errorHandler);

	const server = http.createServer(app);

	// set port, listen for requests
	const port = AppConfig.port;
	server.listen(port, () => {
		console.log(`Server is running on port ${port}.`);
	});
}
