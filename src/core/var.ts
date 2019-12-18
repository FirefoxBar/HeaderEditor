export interface Rule {
	[key: string]: any;
	enable: boolean;
	id: number;
	name: string;
	matchType: "all" | "regexp" | "prefix" | "domain" | "url";
	pattern: string;
	isFunction: boolean;
	code: string;
	exclude: string;
}

export interface InitedRule extends Rule {
	_reg: RegExp;
	_exclude?: RegExp;
	_func: (val: any, detail: any) => any;
}

// export interface RegexRule extends Rule {
// }
// export function isRegexRule(obj: any) : obj is RegexRule {
// 	return obj && obj.matchType === "regexp";
// }