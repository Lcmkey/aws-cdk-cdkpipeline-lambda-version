import { Stack, Construct, StackProps, CfnOutput } from '@aws-cdk/core';
import { DockerImageFunction, DockerImageCode, Runtime, Code } from '@aws-cdk/aws-lambda';
import { LambdaRestApi } from '@aws-cdk/aws-apigateway';
import * as path from 'path';

import { LambdaConstruct } from './lambda-construct';
import { TableViewer } from 'cdk-dynamo-table-viewer';

interface LambdaStackProps extends StackProps {
    readonly prefix: string;
    readonly stage: string;
}

export class LambdaStack extends Stack {
    public readonly hcViewerUrl: CfnOutput;
    public readonly hcEndpoint: CfnOutput;

    constructor(scope: Construct, is: string, props: LambdaStackProps) {
        super(scope, is, props);

        /**
         * Get Env Variables
         */
        const { prefix, stage } = props;

        /**
         * Configure path to Dockerfile
         */
        const dockerfile = path.join(__dirname, "./../src/lambda/hello");

        // const hello = new Function(this, 'HelloHandler', {
        //     runtime: Runtime.NODEJS_10_X,
        //     code: Code.fromAsset(path.resolve(__dirname, './../src/lambda')),
        //     handler: 'hello.handler',
        // });

        /**
         * Signle Lambda
         * Create AWS Lambda function and push image to ECR
         */
        const hello = new DockerImageFunction(this, `Hello-Handler`, {
            functionName: `${prefix}-${stage}-Handler`,
            memorySize: 256,
            code: DockerImageCode.fromImageAsset(dockerfile),
        });

        const helloWithCounter = new LambdaConstruct(this, 'Hit-Counter', {
            prefix,
            stage,
            downstream: hello
        });

        // defines an API Gateway REST API resource backed by our "hello" function.
        // const gateway = new LambdaRestApi(this, 'Endpoint', {
        //     handler: helloWithCounter.handler
        // });

        // const tv = new TableViewer(this, 'ViewHitCounter', {
        //     title: 'Hello Hits',
        //     table: helloWithCounter.table,
        //     sortBy: '-hits'
        // });

        // this.hcEndpoint = new CfnOutput(this, 'GatewayUrl', {
        //     value: gateway.url
        // });

        // this.hcViewerUrl = new CfnOutput(this, 'TableViewerUrl', {
        //     value: tv.endpoint
        // });
    }
}