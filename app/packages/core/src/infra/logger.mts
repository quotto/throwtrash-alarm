// 出力レベルはLambdaの環境変数によって制御されるため、
// ここでは出力レベルの制御は行わない
export default {
	debug: (module: string, method: string, message: string, options?: object) => {
		console.debug({
			module,
			method,
			message,
			...options
		});
	},
	info: (module: string, method: string, message: string, options?: object) => {
		console.info({
			module,
			method,
			message,
			...options
		});
	},
	warn: (module: string, method: string, message: string, options?: object) => {
		console.warn({
			module,
			method,
			message,
			...options
		});
	},
	error: (module: string, method: string, message: string, options?: object) => {
		console.error({
			module,
			method,
			message,
			...options
		});
	}
}