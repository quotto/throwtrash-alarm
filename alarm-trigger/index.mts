import { Callback, Context, EventBridgeEvent, EventBridgeHandler, LambdaFunctionURLEvent } from 'aws-lambda';
export const handler: EventBridgeHandler<string,string,void>  = async (event: EventBridgeEvent<string, string>, _context: Context, callback: Callback) => {
    console.log("Dummy implementation. Replace this with your code.")
    callback(null, "success");
}