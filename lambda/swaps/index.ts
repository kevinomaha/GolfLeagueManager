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
        if (path === '/swaps') {
          // Get all swap requests
          const queryCommand = new QueryCommand({
            TableName: 'SwapRequestsTable',
            KeyConditionExpression: 'status = :status',
            ExpressionAttributeValues: {
              ':status': 'PENDING',
            },
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
          };
        } else if (path.startsWith('/swaps/')) {
          // Get specific swap request
          const swapId = path.split('/')[2];
          const getCommand = new GetCommand({
            TableName: 'SwapRequestsTable',
            Key: { id: swapId },
          });
          const result = await docClient.send(getCommand);
          return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
          };
        }
        break;

      case 'POST':
        if (path === '/swaps') {
          const swapRequest = JSON.parse(event.body);
          const { weekId, requestingPlayerId, targetPlayerId } = swapRequest;

          // Create swap request
          const putCommand = new PutCommand({
            TableName: 'SwapRequestsTable',
            Item: {
              id: `${weekId}-${requestingPlayerId}-${targetPlayerId}`,
              weekId,
              requestingPlayerId,
              targetPlayerId,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
          });
          await docClient.send(putCommand);

          // Send notification to target player
          const publishCommand = new PublishCommand({
            TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
            Message: JSON.stringify({
              type: 'SWAP_REQUEST',
              swapId: `${weekId}-${requestingPlayerId}-${targetPlayerId}`,
              weekId,
              requestingPlayerId,
              targetPlayerId,
            }),
          });
          await snsClient.send(publishCommand);

          return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Swap request created successfully' }),
          };
        }
        break;

      case 'PUT':
        if (path.startsWith('/swaps/')) {
          const swapId = path.split('/')[2];
          const { status } = JSON.parse(event.body);

          // Update swap request status
          const updateCommand = new UpdateCommand({
            TableName: 'SwapRequestsTable',
            Key: { id: swapId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':status': status,
              ':updatedAt': new Date().toISOString(),
            },
          });
          await docClient.send(updateCommand);

          if (status === 'ACCEPTED') {
            // Get swap request details
            const getCommand = new GetCommand({
              TableName: 'SwapRequestsTable',
              Key: { id: swapId },
            });
            const swapRequest = await docClient.send(getCommand);

            // Update schedule entries
            const scheduleUpdateCommand = new UpdateCommand({
              TableName: 'ScheduleTable',
              Key: {
                weekId: swapRequest.Item.weekId,
                playerId: swapRequest.Item.requestingPlayerId,
              },
              UpdateExpression: 'SET playerId = :playerId',
              ExpressionAttributeValues: {
                ':playerId': swapRequest.Item.targetPlayerId,
              },
            });
            await docClient.send(scheduleUpdateCommand);

            // Send notification about accepted swap
            const publishCommand = new PublishCommand({
              TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
              Message: JSON.stringify({
                type: 'SWAP_ACCEPTED',
                swapId,
                weekId: swapRequest.Item.weekId,
                requestingPlayerId: swapRequest.Item.requestingPlayerId,
                targetPlayerId: swapRequest.Item.targetPlayerId,
              }),
            });
            await snsClient.send(publishCommand);
          }

          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Swap request updated successfully' }),
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