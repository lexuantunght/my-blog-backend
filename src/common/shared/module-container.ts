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
	};
};

export const autoRegister = <T>(token: DI.InjectionToken<T>) => {
	return function (target: constructor<T>) {
		DI.container.register(token, target);
	};
};

const resolve = <T>(token: DI.InjectionToken<T>) => DI.container.resolve(token);
const registerSingleton = <T>(token: DI.InjectionToken<T>, target: constructor<T>) =>
	DI.container.registerSingleton(token, target);
const register = <T>(token: DI.InjectionToken<T>, target: constructor<T>) => DI.container.register(token, target);

const ModuleContainer = {
	resolve,
	registerSingleton,
	register,
};

export default ModuleContainer;
