import { CognitoUserPool, AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';

// Get User Pool data from environment variables
const userPoolData = {
  UserPoolId: process.env.REACT_APP_USER_POOL_ID || '',
  ClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || ''
};

console.log('User Pool Configuration:', userPoolData);

export const userPool = new CognitoUserPool(userPoolData);

export const signUp = (email: string, password: string): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    userPool.signUp(
      email,
      password,
      [],
      [],
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result?.user) {
          reject(new Error('Failed to create user'));
          return;
        }
        resolve(result.user);
      }
    );
  });
};

export const signIn = (email: string, password: string): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    const userData = {
      Username: email,
      Pool: userPool
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        localStorage.setItem('accessToken', result.getAccessToken().getJwtToken());
        localStorage.setItem('idToken', result.getIdToken().getJwtToken());
        resolve(cognitoUser);
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        reject(new Error('New password required'));
      }
    });
  });
};

export const signOut = (): void => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
  }
};

export const getCurrentUser = (): CognitoUser | null => {
  return userPool.getCurrentUser();
};

export const getSession = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject(new Error('No user logged in'));
      return;
    }

    currentUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(session);
    });
  });
};