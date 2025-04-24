import ModuleContainer from 'common/shared/module-container';
import { DatabaseToken } from './database';

namespace Database {
	export function getInstance() {
		return ModuleContainer.resolve(DatabaseToken);
	}
}

export default Database;
