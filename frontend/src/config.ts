// AWS Configuration file
export const config = {
  cognito: {
    userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_gZnqU8vRR',
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID || '3doqn1hv7g0s76dbl2go7occmk'
  },
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://65x1ihs7x5.execute-api.us-east-1.amazonaws.com/prod',
    cloudfrontUrl: process.env.REACT_APP_CLOUDFRONT_URL || 'https://du3mmbiqtjmrx.cloudfront.net'
  }
};

console.log('Loaded configuration:', config);
