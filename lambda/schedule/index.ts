import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});
const snsClient = new SNSClient({});

export const handler = async (event: any) => {
  const { httpMethod, path, headers } = event;
  const authorization = headers.Authorization || headers.authorization;

  if (!authorization) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Unauthorized' }),
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
            TableName: 'ScheduleTable',
            KeyConditionExpression: 'weekId BETWEEN :start AND :end',
            ExpressionAttributeValues: {
              ':start': '2024-04-28',
              ':end': '2024-08-18',
            },
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
          };
        } else if (path.startsWith('/schedule/')) {
          // Get specific week
          const weekId = path.split('/')[2];
          const queryCommand = new QueryCommand({
            TableName: 'ScheduleTable',
            KeyConditionExpression: 'weekId = :weekId',
            ExpressionAttributeValues: {
              ':weekId': weekId,
            },
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
          };
        }
        break;

      case 'POST':
        if (path === '/schedule') {
          const schedule = JSON.parse(event.body);
          const { weekId, playerId, time, course } = schedule;

          // Create schedule entry
          const putCommand = new PutCommand({
            TableName: 'ScheduleTable',
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
            body: JSON.stringify({ message: 'Schedule created successfully' }),
          };
        }
        break;

      case 'PUT':
        if (path.startsWith('/schedule/')) {
          const weekId = path.split('/')[2];
          const updates = JSON.parse(event.body);
          
          // Update schedule entry
          const updateCommand = new UpdateCommand({
            TableName: 'ScheduleTable',
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
            body: JSON.stringify({ message: 'Schedule updated successfully' }),
          };
        }
        break;

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}; 