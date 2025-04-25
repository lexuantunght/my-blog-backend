import type { Express } from 'express';
import { registerAccountAPIs } from './account.api';

export function registerAPIs(app: Express) {
	registerAccountAPIs(app);
}
