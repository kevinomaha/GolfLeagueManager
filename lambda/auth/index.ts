import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handler = async (event: any) => {
  try {
    const { email, password } = JSON.parse(event.body);

    const initiateAuthCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const authResponse = await cognitoClient.send(initiateAuthCommand);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        tokens: {
          accessToken: authResponse.AuthenticationResult?.AccessToken,
          idToken: authResponse.AuthenticationResult?.IdToken,
          refreshToken: authResponse.AuthenticationResult?.RefreshToken,
        },
      }),
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      statusCode: 401,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}; 