type lambdaHandlerFuncType = (event: any, context: any) => Promise<any>;

export const handler: lambdaHandlerFuncType = async (event: any, context: any) => {
    console.log('request:', JSON.stringify(event, undefined, 2));

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: `Hello, CDK! You've hit "${event.path}". That's not very polite, "${event.path}" did not do anything to you...\n`
    };
};