import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { CognitoUserManager } from './cognito-users';

export class GolfLeagueManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'GolfLeagueUserPool', {
      userPoolName: 'golf-league-users',
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        phoneNumber: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'GolfLeagueUserPoolClient', {
      userPool,
      userPoolClientName: 'golf-league-web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000',
          'https://dau89hcxeanaz.cloudfront.net'
        ],
        logoutUrls: [
          'http://localhost:3000/login',
          'https://dau89hcxeanaz.cloudfront.net/login'
        ],
      },
      accessTokenValidity: cdk.Duration.days(1),
      idTokenValidity: cdk.Duration.days(1),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
    });

    // Initialize Cognito User Manager
    new CognitoUserManager(this, 'CognitoUserManager', userPool);

    // Create DynamoDB Tables
    const playersTable = new dynamodb.Table(this, 'PlayersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const scheduleTable = new dynamodb.Table(this, 'ScheduleTable', {
      partitionKey: { name: 'weekId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'playerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Create SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      displayName: 'Golf League Notifications',
    });

    // Create S3 bucket for static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Add bucket policy to allow public read access
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
      })
    );

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'GolfLeagueManagerApiV2', {
      restApiName: 'Golf League Manager API V2',
      description: 'API for managing golf league data',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
          'Access-Control-Allow-Origin',
          'Access-Control-Allow-Headers'
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
        maxAge: cdk.Duration.seconds(600),
        exposeHeaders: [
          'Access-Control-Allow-Origin',
          'Access-Control-Allow-Credentials'
        ]
      },
    });

    // Create the CORS Proxy Lambda function
    const corsProxyLambda = new lambda.Function(this, 'CorsProxyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/cors-proxy.zip'),
      timeout: cdk.Duration.seconds(30), // Increase timeout for proxy requests
      memorySize: 256,
    });

    // Create Lambda functions
    const authLambda = new lambda.Function(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/auth'),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const playersLambda = new lambda.Function(this, 'PlayersFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/players'),
      environment: {
        PLAYERS_TABLE_NAME: playersTable.tableName,
      },
    });

    const scheduleLambda = new lambda.Function(this, 'ScheduleFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/schedule'),
      environment: {
        SCHEDULE_TABLE_NAME: scheduleTable.tableName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    const swapsLambda = new lambda.Function(this, 'SwapsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/swaps'),
      environment: {
        SWAPS_TABLE_NAME: 'SwapRequestsTable',
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    // Grant DynamoDB permissions to Lambda functions
    playersTable.grantReadWriteData(playersLambda);
    scheduleTable.grantReadWriteData(scheduleLambda);

    // Grant SNS permissions to schedule Lambda
    notificationTopic.grantPublish(scheduleLambda);

    // Add Lambda integrations for API Gateway
    const corsProxyIntegration = new apigateway.LambdaIntegration(corsProxyLambda, {
      proxy: true,
      allowTestInvoke: false,
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    });

    const authIntegration = new apigateway.LambdaIntegration(authLambda, {
      proxy: true,
      allowTestInvoke: false,
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    });

    const playersIntegration = new apigateway.LambdaIntegration(playersLambda, {
      proxy: true,
      allowTestInvoke: false,
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    });

    const scheduleIntegration = new apigateway.LambdaIntegration(scheduleLambda, {
      proxy: true,
      allowTestInvoke: false,
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    });

    const swapsIntegration = new apigateway.LambdaIntegration(swapsLambda, {
      proxy: true,
      allowTestInvoke: false,
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    });

    // CORS Proxy endpoint
    const proxyResource = api.root.addResource('proxy');
    proxyResource.addMethod('GET', corsProxyIntegration);
    proxyResource.addMethod('POST', corsProxyIntegration);
    proxyResource.addMethod('PUT', corsProxyIntegration);
    proxyResource.addMethod('DELETE', corsProxyIntegration);
    
    // Add a wildcard proxy endpoint for flexibility
    const wildcardProxyResource = proxyResource.addResource('{proxy+}');
    wildcardProxyResource.addMethod('GET', corsProxyIntegration);
    wildcardProxyResource.addMethod('POST', corsProxyIntegration);
    wildcardProxyResource.addMethod('PUT', corsProxyIntegration);
    wildcardProxyResource.addMethod('DELETE', corsProxyIntegration);
    wildcardProxyResource.addMethod('OPTIONS', corsProxyIntegration);

    // Auth endpoints
    const authResource = api.root.addResource('auth');
    authResource.addMethod('POST', authIntegration);

    // Players endpoints
    const playersResource = api.root.addResource('players');
    playersResource.addMethod('GET', playersIntegration);
    playersResource.addMethod('POST', playersIntegration);

    const playerResource = playersResource.addResource('{id}');
    playerResource.addMethod('GET', playersIntegration);
    playerResource.addMethod('PUT', playersIntegration);
    playerResource.addMethod('DELETE', playersIntegration);

    // Schedule endpoints
    const scheduleResource = api.root.addResource('schedule');
    scheduleResource.addMethod('GET', scheduleIntegration);
    scheduleResource.addMethod('POST', scheduleIntegration);

    const weekResource = scheduleResource.addResource('{weekId}');
    weekResource.addMethod('GET', scheduleIntegration);
    weekResource.addMethod('PUT', scheduleIntegration);

    // Swaps endpoints
    const swapsResource = api.root.addResource('swaps');
    swapsResource.addMethod('GET', swapsIntegration);
    swapsResource.addMethod('POST', swapsIntegration);

    const swapResource = swapsResource.addResource('{id}');
    swapResource.addMethod('GET', swapsIntegration);
    swapResource.addMethod('PUT', swapsIntegration);

    // Add specific actions for swap approval/rejection
    const approveResource = swapResource.addResource('approve');
    approveResource.addMethod('PUT', swapsIntegration);

    const rejectResource = swapResource.addResource('reject');
    rejectResource.addMethod('PUT', swapsIntegration);

    // Output important values
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: distribution.distributionDomainName,
      description: 'Website URL',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Website S3 Bucket Name',
    });
    
    // Add CORS Proxy URL output
    new cdk.CfnOutput(this, 'CorsProxyUrl', {
      value: `${api.url}proxy/`,
      description: 'CORS Proxy URL',
    });
  }
}