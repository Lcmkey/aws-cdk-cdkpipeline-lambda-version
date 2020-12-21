require("dotenv").config();

import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { LambdaConstruct } from '../lib/lambda-construct';

const {
  PREFIX: prefix = "[STACK_PREFIX_NAME]",
  STAGE: stage = "[DEPLOYMENT_STAGE]",
} = process.env;


test('DynamoDB Table Created', () => {
  const stack = new cdk.Stack();

  const tableCreateLambda = new lambda.Function(stack, 'TestFunction', {
    runtime: lambda.Runtime.NODEJS_10_X,
    handler: 'lambda.handler',
    code: lambda.Code.inline('test')
  });

  new LambdaConstruct(stack, 'MyTestConstruct', {
    prefix,
    stage,
    downstream: tableCreateLambda
  });
  // THEN

  expectCDK(stack).to(haveResource("AWS::DynamoDB::Table", {
    SSESpecification: {
      SSEEnabled: true
    }
  }));
});

test('Lambda Has Environment Variables', () => {
  const stack = new cdk.Stack();

  new LambdaConstruct(stack, 'MyTestConstruct', {
    prefix,
    stage,
    downstream: new lambda.Function(stack, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'lambda.handler',
      code: lambda.Code.inline('test')
    })
  });

  expectCDK(stack).to(haveResource("AWS::Lambda::Function", {
    Environment: {
      Variables: {
        DOWNSTREAM_FUNCTION_NAME: {
          "Ref": "TestFunction22AD90FC"
        },
        HITS_TABLE_NAME: {
          "Ref": "MyTestConstructHits24A357F0"
        }
      }
    }
  }));
});

test('Read Capacity can be configured', () => {
  const stack = new cdk.Stack();

  expect(() => {
    new LambdaConstruct(stack, 'MyTestConstruct', {
      prefix,
      stage,
      downstream: new lambda.Function(stack, 'TestFunction', {
        runtime: lambda.Runtime.NODEJS_10_X,
        handler: 'lambda.handler',
        code: lambda.Code.inline('test')
      }),
      // readCapacity: 3
    });
  }).toThrowError(/readCapacity must be greater than 5 and less than 20/);
});