namespace ObjectUtils {
	export function get<T extends {}, F>(obj: T, field: string, fallback?: F) {
		if (obj.hasOwnProperty(field)) {
			return obj[field as keyof T];
		}
		return fallback;
	}
}

export default ObjectUtils;
