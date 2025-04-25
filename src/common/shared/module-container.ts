import * as DI from 'tsyringe';
import constructor from 'tsyringe/dist/typings/types/constructor';

export type InjectionToken<T> = DI.InjectionToken<T>;

export const define = <T>(service: string): DI.InjectionToken<T> => {
	const token = service;
	return token;
};

export const injectable = DI.injectable;
export const inject = <T>(token: DI.InjectionToken<T>) => DI.inject(token);
export const singleton = <T>(token: DI.InjectionToken<T>) => {
	return function (target: constructor<T>) {
		DI.container.registerSingleton(token, target);
		console.log('[DI] register singleton', token);
	};
};

export const autoRegister = <T>(token: DI.InjectionToken<T>) => {
	return function (target: constructor<T>) {
		DI.container.register(token, target);
	};
};

const ModuleContainer = new (class ModuleContainer {
	resolve = <T>(token: DI.InjectionToken<T>) => DI.container.resolve(token);
	registerSingleton = <T>(token: DI.InjectionToken<T>, target: constructor<T>) => {
		DI.container.registerSingleton(token, target);
		console.log('[DI] register singleton', token);
	};
	register = <T>(token: DI.InjectionToken<T>, target: constructor<T>) => DI.container.register(token, target);
})();

export default ModuleContainer;
