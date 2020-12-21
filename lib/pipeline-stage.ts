import { Stage, CfnOutput, Construct, StageProps } from '@aws-cdk/core';

import { LambdaStack } from './lambda-stack';

interface PipelineStageProps extends StageProps {
    readonly prefix: string;
    readonly stage: string;
}

export class PipelineStage extends Stage {
    public readonly hcViewerUrl: CfnOutput;
    public readonly hcEndpoint: CfnOutput;

    constructor(scope: Construct, id: string, props: PipelineStageProps) {
        super(scope, id, props);

        /**
         * Get Env Variables
         */
        const { prefix, stage } = props;

        const service = new LambdaStack(this, 'Lambda-Service', { prefix, stage });

        this.hcEndpoint = service.hcEndpoint;
        this.hcViewerUrl = service.hcViewerUrl;
    }
}