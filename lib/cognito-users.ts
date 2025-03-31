import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface CognitoUser {
  email: string;
  name: string;
  phoneNumber?: string;
}

export const GOLF_LEAGUE_USERS: CognitoUser[] = [
  {
    email: 'bbarstow68@gmail.com',
    name: 'Bruce Barstow',
  },
  {
    email: 'russellavalon@gmail.com',
    name: 'Russell Avalon',
  },
  {
    email: 'jordanthansen97@gmail.com',
    name: 'Jordan Hansen',
  },
  {
    email: 'kevin.cory@mutualofomaha.com',
    name: 'Kevin Cory',
  },
  {
    email: 'ryan.wand@mutualofomaha.com',
    name: 'Ryan Wand',
  },
  {
    email: 'Travis.Lavine@mutualofomaha.com',
    name: 'Travis Lavine',
  },
  {
    email: 'Mark.Boaz@mutualofomaha.com',
    name: 'Mark Boaz',
  },
  {
    email: 'nolan.slimp@mutualofomaha.com',
    name: 'Nolan Slimp',
  },
];

export class CognitoUserManager extends Construct {
  constructor(scope: Construct, id: string, userPool: cognito.UserPool) {
    super(scope, id);

    // Create a custom resource to manage Cognito users
    new cr.AwsCustomResource(this, 'CreateCognitoUsers', {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminCreateUser',
        parameters: {
          UserPoolId: userPool.userPoolId,
          Username: GOLF_LEAGUE_USERS[0].email,
          UserAttributes: [
            {
              Name: 'email',
              Value: GOLF_LEAGUE_USERS[0].email,
            },
            {
              Name: 'name',
              Value: GOLF_LEAGUE_USERS[0].name,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
          TemporaryPassword: 'Welcome123!',
          MessageAction: 'SUPPRESS',
        },
        physicalResourceId: cr.PhysicalResourceId.of('CognitoUsers'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [userPool.userPoolArn],
      }),
    });

    // Create users using a Lambda function
    const createUsersFunction = new lambda.Function(this, 'CreateUsersFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const cognito = new AWS.CognitoIdentityServiceProvider();
        
        const users = ${JSON.stringify(GOLF_LEAGUE_USERS)};
        
        exports.handler = async function(event) {
          for (const user of users) {
            try {
              await cognito.adminCreateUser({
                UserPoolId: '${userPool.userPoolId}',
                Username: user.email,
                UserAttributes: [
                  {
                    Name: 'email',
                    Value: user.email,
                  },
                  {
                    Name: 'name',
                    Value: user.name,
                  },
                  {
                    Name: 'email_verified',
                    Value: 'true',
                  },
                ],
                TemporaryPassword: 'Welcome123!',
                MessageAction: 'SUPPRESS',
              }).promise();
              
              console.log(\`Created user: \${user.email}\`);
            } catch (error) {
              if (error.code !== 'UsernameExistsException') {
                throw error;
              }
              console.log(\`User already exists: \${user.email}\`);
            }
          }
          return { Status: 'SUCCESS' };
        };
      `),
    });

    // Grant the Lambda function permissions to create users
    userPool.grant(createUsersFunction, 'cognito-idp:AdminCreateUser');

    // Create a custom resource that invokes the Lambda function
    new cr.Provider(this, 'CreateUsersProvider', {
      onEventHandler: createUsersFunction,
    });
  }
} 