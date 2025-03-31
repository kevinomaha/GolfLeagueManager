import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminInitiateAuthCommand, AdminRespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

const USER_POOL_ID = 'us-east-1_7azK6A4fM';
const CLIENT_ID = '6ehscd1d5a7ujajlocd7vtis3u';

// List of all users to create
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

async function createUser(email: string, name: string) {
  try {
    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'name',
          Value: name,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
      TemporaryPassword: 'Welcome123!',
      MessageAction: 'SUPPRESS',
    });

    const createResponse = await client.send(createCommand);
    console.log(`Created user: ${email}`);

    // Initiate auth with temporary password
    const initiateAuthCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: 'Welcome123!',
      },
    });

    const authResponse = await client.send(initiateAuthCommand);
    console.log(`Initiated auth for user: ${email}`);

    if (authResponse.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      // Respond to new password challenge
      const respondToAuthCommand = new AdminRespondToAuthChallengeCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: 'Welcome123!',
        },
        Session: authResponse.Session,
      });

      await client.send(respondToAuthCommand);
      console.log(`Set permanent password for user: ${email}`);
    }

    return createResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'UsernameExistsException') {
      console.log(`User already exists: ${email}`);
      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: 'Welcome123!',
        Permanent: true,
      });

      await client.send(setPasswordCommand);
      console.log(`Set permanent password for existing user: ${email}`);
    } else {
      console.error(`Failed to create user ${email}:`, error);
      throw error;
    }
  }
}

// Create all users
async function createAllUsers() {
  console.log('Starting user creation...\n');
  
  for (const user of users) {
    try {
      await createUser(user.email, user.name);
      console.log('----------------------------------------\n');
    } catch (error) {
      console.error(`Failed to process user ${user.email}`);
      console.log('----------------------------------------\n');
    }
  }
  
  console.log('All users processed');
}

// Run the creation
createAllUsers()
  .catch(error => console.error('Creation failed:', error)); 