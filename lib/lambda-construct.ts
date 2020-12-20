import { Construct } from '@aws-cdk/core';
import { IFunction, DockerImageFunction, DockerImageCode, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Table, AttributeType } from '@aws-cdk/aws-dynamodb';
import * as path from "path";


export interface LambdaConstructProps {
    prefix: string;
    stage: string;
    /** the function for which we want to count url hits **/
    downstream: IFunction;
}

export class LambdaConstruct extends Construct {
    /** allows accessing the counter function */
    public readonly handler: Function;

    /** the hit counter table */
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: LambdaConstructProps) {
        super(scope, id);

        /**
         * Get var from props
         */
        const { prefix, stage } = props;

        const table = new Table(this, 'Hits', {
            partitionKey: { name: 'path', type: AttributeType.STRING }
        });


        /**
         * Configure path to Dockerfile
         */
        const dockerfile = path.join(__dirname, "./../src/lambda/hitCounter");

        /**
         * Signle Lambda
         * Create AWS Lambda function and push image to ECR
         */
        const hanlder = new DockerImageFunction(this, `${prefix}-${stage}-Handler`, {
            functionName: `${prefix}-${stage}-Handler`,
            memorySize: 256,
            code: DockerImageCode.fromImageAsset(dockerfile),
        });


        // this.handler = new Function(this, 'HitCounterHandler', {
        //     runtime: Runtime.NODEJS_10_X,
        //     handler: 'hitcounter.handler',
        //     code: Code.fromAsset(path.join(__dirname, "./../src/lambda")),
        //     environment: {
        //         DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        //         HITS_TABLE_NAME: table.tableName
        //     }
        // });

        this.table = table;
        // this.handler = hanlder;

        // grant the lambda role read/write permissions to our table
        // table.grantReadWriteData(this.handler);

        // grant the lambda role invoke permissions to the downstream function
        // props.downstream.grantInvoke(this.handler);
    }
}