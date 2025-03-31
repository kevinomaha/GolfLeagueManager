# Golf League Manager

A serverless application for managing a golf league schedule, built with AWS CDK and TypeScript.

## Features

- User authentication with email/password
- Player management (up to 10 players)
- Weekly schedule management (April 28th - August 18th)
- Player swap functionality
- Email and SMS notifications
- Modern web interface

## Architecture

The application uses the following AWS services:

- AWS Cognito for authentication
- DynamoDB for data storage
- Lambda for backend functions
- API Gateway for REST API
- SNS for email and SMS notifications
- S3 for static web hosting
- CloudFront for content delivery

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the Lambda functions:
```bash
cd lambda
npm install
npm run build
cd ..
```

3. Deploy the application:
```bash
cdk deploy
```

## Project Structure

```
.
├── bin/                    # CDK app entry point
├── lib/                    # CDK stack definitions
├── lambda/                 # Lambda function source code
│   ├── auth/              # Authentication Lambda
│   ├── players/           # Player management Lambda
│   ├── schedule/          # Schedule management Lambda
│   ├── swaps/             # Swap requests Lambda
│   └── notifications/     # Notification handling Lambda
└── test/                  # Test files
```

## API Endpoints

### Authentication
- POST /auth - Authenticate user

### Players
- GET /players - Get all players
- GET /players/{id} - Get specific player
- POST /players - Create new player
- PUT /players/{id} - Update player

### Schedule
- GET /schedule - Get all weeks
- GET /schedule/{weekId} - Get specific week
- POST /schedule - Create schedule entry
- PUT /schedule/{weekId} - Update schedule entry

### Swaps
- GET /swaps - Get all swap requests
- GET /swaps/{id} - Get specific swap request
- POST /swaps - Create swap request
- PUT /swaps/{id} - Update swap request status

## Environment Variables

The following environment variables need to be set:

- `EMAIL_FROM`: Email address to send notifications from
- `SMS_TOPIC_ARN`: SNS topic ARN for SMS notifications
- `NOTIFICATION_TOPIC_ARN`: SNS topic ARN for general notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
