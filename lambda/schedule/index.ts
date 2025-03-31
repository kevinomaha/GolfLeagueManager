import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const snsClient = new SNSClient({});

// CORS headers that will be included in all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dau89hcxeanaz.cloudfront.net',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event));
  
  const { httpMethod, path, headers } = event;
  
  // Handle OPTIONS requests immediately
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }
  
  const authorization = headers?.Authorization || headers?.authorization;

  // Check authentication (except for OPTIONS which we already handled)
  if (!authorization) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        statusCode: 401,
        body: { message: 'Unauthorized' }
      }),
    };
  }

  try {
    // Verify the token and get user information
    const getUserCommand = new GetUserCommand({
      AccessToken: authorization.split(' ')[1],
    });
    const userResponse = await cognitoClient.send(getUserCommand);

    switch (httpMethod) {
      case 'GET':
        if (path === '/schedule') {
          // Get all weeks
          const queryCommand = new QueryCommand({
            TableName: 'GolfLeagueManagerStack-ScheduleTable6DED49F5-694JWNA8A468',
            KeyConditionExpression: 'weekId BETWEEN :start AND :end',
            ExpressionAttributeValues: {
              ':start': '2024-04-28',
              ':end': '2024-08-18',
            },
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: result.Items || []
            })
          };
        } else if (path.startsWith('/schedule/')) {
          // Get specific week
          const weekId = path.split('/')[2];
          const queryCommand = new QueryCommand({
            TableName: 'GolfLeagueManagerStack-ScheduleTable6DED49F5-694JWNA8A468',
            KeyConditionExpression: 'weekId = :weekId',
            ExpressionAttributeValues: {
              ':weekId': weekId,
            },
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: result.Items || []
            })
          };
        }
        break;

      case 'POST':
        if (path === '/schedule') {
          const schedule = JSON.parse(event.body);
          const { weekId, playerId, time, course } = schedule;

          // Create schedule entry
          const putCommand = new PutCommand({
            TableName: 'GolfLeagueManagerStack-ScheduleTable6DED49F5-694JWNA8A468',
            Item: {
              weekId,
              playerId,
              time,
              course,
            },
          });
          await docClient.send(putCommand);

          // Send notification
          const publishCommand = new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
            Message: JSON.stringify({
              type: 'SCHEDULE_UPDATE',
              weekId,
              playerId,
              time,
              course,
            }),
          });
          await snsClient.send(publishCommand);

          return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 201,
              body: { message: 'Schedule created successfully' }
            }),
          };
        }
        break;

      case 'PUT':
        if (path.startsWith('/schedule/')) {
          const weekId = path.split('/')[2];
          const updates = JSON.parse(event.body);
          
          // Update schedule entry
          const updateCommand = new UpdateCommand({
            TableName: 'GolfLeagueManagerStack-ScheduleTable6DED49F5-694JWNA8A468',
            Key: {
              weekId,
              playerId: updates.playerId,
            },
            UpdateExpression: 'SET #time = :time, course = :course',
            ExpressionAttributeNames: {
              '#time': 'time',
            },
            ExpressionAttributeValues: {
              ':time': updates.time,
              ':course': updates.course,
            },
          });
          await docClient.send(updateCommand);

          // Send notification
          const publishCommand = new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
            Message: JSON.stringify({
              type: 'SCHEDULE_UPDATE',
              weekId,
              playerId: updates.playerId,
              time: updates.time,
              course: updates.course,
            }),
          });
          await snsClient.send(publishCommand);

          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: { message: 'Schedule updated successfully' }
            }),
          };
        }
        break;

      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({
            statusCode: 405,
            body: { message: 'Method not allowed' }
          }),
        };
    }
    
    // If we reach here, it means no handler matched
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        statusCode: 404,
        body: { message: 'Resource not found' }
      }),
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        statusCode: 500,
        body: {
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }),
    };
  }
};