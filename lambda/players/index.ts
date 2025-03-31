import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});

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
        if (path === '/players') {
          // Get all players
          const queryCommand = new QueryCommand({
            TableName: 'PlayersTable',
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
        } else if (path.startsWith('/players/')) {
          // Get specific player
          const playerId = path.split('/')[2];
          const getCommand = new GetCommand({
            TableName: 'PlayersTable',
            Key: { id: playerId },
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
        if (path === '/players') {
          const player = JSON.parse(event.body);
          const putCommand = new PutCommand({
            TableName: 'PlayersTable',
            Item: {
              id: player.id,
              name: player.name,
              email: player.email,
              phoneNumber: player.phoneNumber,
              percentage: player.percentage || 50,
            },
          });
          await docClient.send(putCommand);
          return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 201,
              body: { message: 'Player created successfully' }
            }),
          };
        }
        break;

      case 'PUT':
        if (path.startsWith('/players/')) {
          const playerId = path.split('/')[2];
          const updates = JSON.parse(event.body);
          const updateCommand = new PutCommand({
            TableName: 'PlayersTable',
            Item: {
              id: playerId,
              ...updates,
            },
          });
          await docClient.send(updateCommand);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              statusCode: 200,
              body: { message: 'Player updated successfully' }
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