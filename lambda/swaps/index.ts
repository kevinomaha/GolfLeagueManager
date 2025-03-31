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
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: result.Items
            }),
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
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: result.Item
            }),
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
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 201,
              body: { message: 'Swap request created successfully' }
            }),
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
            const swapResult = await docClient.send(getCommand);
            const swapItem = swapResult.Item;
            
            if (!swapItem) {
              return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({
                  statusCode: 404,
                  body: { message: 'Swap request not found' }
                }),
              };
            }

            // Update schedule entries
            const scheduleUpdateCommand = new UpdateCommand({
              TableName: 'ScheduleTable',
              Key: {
                weekId: swapItem.weekId,
                playerId: swapItem.requestingPlayerId,
              },
              UpdateExpression: 'SET playerId = :playerId',
              ExpressionAttributeValues: {
                ':playerId': swapItem.targetPlayerId,
              },
            });
            await docClient.send(scheduleUpdateCommand);

            // Send notification about accepted swap
            const publishCommand = new PublishCommand({
              TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
              Message: JSON.stringify({
                type: 'SWAP_ACCEPTED',
                swapId,
                weekId: swapItem.weekId,
                requestingPlayerId: swapItem.requestingPlayerId,
                targetPlayerId: swapItem.targetPlayerId,
              }),
            });
            await snsClient.send(publishCommand);
          }

          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: { message: 'Swap request updated successfully' }
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