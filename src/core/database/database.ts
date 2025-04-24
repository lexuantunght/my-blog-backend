import { define } from 'common/shared/module-container';
import type { Database } from './database.impl';

export const DatabaseToken = define<Database>('database');
