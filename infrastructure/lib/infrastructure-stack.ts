import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Cognito User Pool ---
    const userPool = new cognito.UserPool(this, 'GolfLeagueUserPool', {
      userPoolName: 'GolfLeagueUserPool',
      signInAliases: {
        email: true,
        username: true,
      },
      selfSignUpEnabled: true, // Allows users to sign themselves up
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false, // Keeping it simpler for now
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // Output the User Pool ID
    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
      value: userPool.userPoolId,
      description: 'The ID of the Cognito User Pool',
      exportName: 'GolfLeagueUserPoolId',
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
