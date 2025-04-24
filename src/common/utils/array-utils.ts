namespace ArrayUtils {
	export const sum = (arr: number[]) => {
		return arr.reduce((total, item) => total + item, 0);
	};

	export const sumBy = <T>(selector: (item: T) => number, arr: T[]) => {
		return arr.reduce((total, item) => total + selector(item), 0);
	};

	export const chunk = <T>(items: T[], size: number) => {
		const result: T[][] = [];
		for (let i = 0; i < items.length; i += size) {
			result.push(items.slice(i, i + size));
		}
		return result;
	};
}

export default ArrayUtils;
