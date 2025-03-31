import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});

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
        if (path === '/players') {
          // Get all players
          const queryCommand = new QueryCommand({
            TableName: 'PlayersTable',
          });
          const result = await docClient.send(queryCommand);
          return {
            statusCode: 200,
            body: JSON.stringify(result.Items),
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
            body: JSON.stringify(result.Item),
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
              weeksScheduled: player.weeksScheduled || 0,
            },
          });
          await docClient.send(putCommand);
          return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Player created successfully' }),
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
            body: JSON.stringify({ message: 'Player updated successfully' }),
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