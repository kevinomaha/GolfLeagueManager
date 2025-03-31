import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_7azK6A4fM';
const CLIENT_ID = '6ehscd1d5a7ujajlocd7vtis3u';

// List of all users to test
const users = [
  { email: 'bbarstow68@gmail.com', name: 'Bruce Barstow' },
  { email: 'russellavalon@gmail.com', name: 'Russell Avalon' },
  { email: 'jordanthansen97@gmail.com', name: 'Jordan Hansen' },
  { email: 'kevin.cory@mutualofomaha.com', name: 'Kevin Cory' },
  { email: 'ryan.wand@mutualofomaha.com', name: 'Ryan Wand' },
  { email: 'Travis.Lavine@mutualofomaha.com', name: 'Travis Lavine' },
  { email: 'Mark.Boaz@mutualofomaha.com', name: 'Mark Boaz' },
  { email: 'nolan.slimp@mutualofomaha.com', name: 'Nolan Slimp' },
];

async function testLogin(email: string, password: string) {
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    console.log(`Login successful for ${email}!`);
    console.log('Access Token:', response.AuthenticationResult?.AccessToken);
    console.log('ID Token:', response.AuthenticationResult?.IdToken);
    return response;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error);
    throw error;
  }
}

// Test all users
async function testAllUsers() {
  console.log('Starting login tests for all users...\n');
  
  for (const user of users) {
    try {
      await testLogin(user.email, 'Welcome123!');
      console.log('----------------------------------------\n');
    } catch (error) {
      console.error(`Failed to test user ${user.email}`);
      console.log('----------------------------------------\n');
    }
  }
  
  console.log('All tests completed');
}

// Run the tests
testAllUsers()
  .catch(error => console.error('Test suite failed:', error)); 