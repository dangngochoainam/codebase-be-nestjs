export function stringToBoolean(value: any): boolean {
	if (typeof value === "string") {
		return value.toLowerCase() === "true";
	}
	return value;
}
