import { Stack, Construct, StackProps, CfnOutput, Duration } from '@aws-cdk/core';
import { DockerImageFunction, DockerImageCode } from '@aws-cdk/aws-lambda';
import { LambdaRestApi } from '@aws-cdk/aws-apigateway';
import { TableViewer } from 'cdk-dynamo-table-viewer';
import * as path from 'path';
import * as shell from "shelljs";

import { LambdaConstruct } from './lambda-construct';

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
         * Budil souce code from ts to js
         */
        shell.exec("cd ./src/lambda/hello && npm run build");
        shell.exec("cd ./src/lambda/hitCounter && npm run build");

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
            functionName: `${prefix}-${stage}-Hello-Handler`,
            memorySize: 256,
            code: DockerImageCode.fromImageAsset(dockerfile),
            timeout: Duration.seconds(30),
        });

        const helloWithCounter = new LambdaConstruct(this, 'Hit-Counter', {
            prefix,
            stage,
            downstream: hello
        });

        /**
         * defines an API Gateway REST API resource backed by our "hello" function.
         */
        const gateway = new LambdaRestApi(this, `${prefix}-${stage}-Endpoint`, {
            handler: helloWithCounter.handler
        });

        const tv = new TableViewer(this, `${prefix}-${stage}-ViewHitCounter`, {
            title: 'Hello Hits',
            table: helloWithCounter.table,
            sortBy: '-hits'
        });

        this.hcEndpoint = new CfnOutput(this, 'GatewayUrl', {
            value: gateway.url
        });

        this.hcViewerUrl = new CfnOutput(this, 'TableViewerUrl', {
            value: tv.endpoint
        });
    }
}