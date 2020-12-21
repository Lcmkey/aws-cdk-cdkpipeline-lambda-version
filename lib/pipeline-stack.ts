import { Stack, Construct, StackProps, SecretValue } from '@aws-cdk/core';
import { Artifact, } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { ShellScriptAction, SimpleSynthAction, CdkPipeline } from "@aws-cdk/pipelines";
import { StringParameter } from '@aws-cdk/aws-ssm';
// import { Repository } from '@aws-cdk/aws-codecommit';

import { PipelineStage } from './pipeline-stage';

interface PipelineStackProps extends StackProps {
    readonly prefix: string;
    readonly stage: string;
    readonly repo: string;
    readonly owner: string;
    readonly branch: string;
    readonly oauthToken: string;
}

export class PipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        /**
         * Get Env Variables
         */
        const { prefix, stage, repo, owner, branch, oauthToken } = props;

        /**
         * Defines the artifact representing the sourcecode
         */
        const sourceArtifact = new Artifact();
        /**
         * Defines the artifact representing the cloud assembly 
         * (cloudformation template + all other assets)
         */
        const cloudAssemblyArtifact = new Artifact();

        /**
         * This creates a new CodeCommit repository
         */
        // const repo = new Repository(this, `${prefix}-${stage}-Repo`, {
        //     repositoryName: `${prefix}-${stage}-Repo`
        // });

        // const sourceAction = new CodeCommitSourceAction({
        //     actionName: 'CodeCommit', // Any Git-based source control
        //     output: sourceArtifact, // Indicates where the artifact is stored
        //     repository: repo // Designates the repo to draw code from
        // });

        /**
         * Git respository
         */
        const sourceAction = new GitHubSourceAction({
            actionName: "GitHub_Source_Download",
            repo,
            owner,
            branch,
            oauthToken: SecretValue.plainText(
                StringParameter.valueForStringParameter(this, `/${prefix}/${stage}/${oauthToken}`)),
            trigger: GitHubTrigger.POLL, // "WEBHOOK", "NONE"
            output: sourceArtifact
        });

        /**
         * The basic pipeline declaration. This sets the initial structure of our pipeline
         */
        const pipeline = new CdkPipeline(this, `${prefix}-${stage}-pipeline`, {
            pipelineName: `${prefix}-${stage}-pipeline`,
            cloudAssemblyArtifact,

            /**
             * Generates the source artifact from the repo we created in the last step
             */
            sourceAction,

            /**
             * Builds our source code outlined above into a could assembly artifact
             */
            synthAction: SimpleSynthAction.standardNpmSynth({
                sourceArtifact, // Where to get source code to build
                cloudAssemblyArtifact, // Where to place built source
                installCommand: "npm i",
                buildCommand: "npx cdk synth",
                // buildCommand: 'npm run build' // Language-specific build cmd
                environmentVariables: {
                    commitId: { value: "#{SourceNameSpace.CommitId}" },
                    execId: { value: "#{codepipeline.PipelineExecutionId}" },
                    PREFIX: { value: prefix },
                    STAGE: { value: stage },
                    CDK_ACCOUNT: { value: process.env.CDK_DEFAULT_ACCOUNT },
                    CDK_REGION: { value: process.env.CDK_DEFAULT_REGION },
                    REPO: { value: repo },
                    OWNER: { value: owner },
                    BRANCH: { value: branch }
                }
            })
        });

        /**
         * Add Pipeline Accplication Stage
         */
        const deploy = new PipelineStage(this, `App-Deploy-Stage`, { prefix, stage });
        const deployStage = pipeline.addApplicationStage(deploy);

        /**
         * Stage Add Actions to test the service
         */
        deployStage.addActions(new ShellScriptAction({
            actionName: 'TestViewerEndpoint',
            useOutputs: {
                ENDPOINT_URL: pipeline.stackOutput(deploy.hcViewerUrl)
            },
            commands: [
                'curl -Ssf $ENDPOINT_URL'
            ]
        }));

        deployStage.addActions(new ShellScriptAction({
            actionName: 'TestAPIGatewayEndpoint',
            useOutputs: {
                ENDPOINT_URL: pipeline.stackOutput(deploy.hcEndpoint)
            },
            commands: [
                'curl -Ssf $ENDPOINT_URL/',
                'curl -Ssf $ENDPOINT_URL/hello',
                'curl -Ssf $ENDPOINT_URL/test'
            ]
        }));
    }
}