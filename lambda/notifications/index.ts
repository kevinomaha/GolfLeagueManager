import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});
const snsClient = new SNSClient({});

export const handler = async (event: any) => {
  try {
    const message = JSON.parse(event.Records[0].Sns.Message);
    const { type, weekId, playerId, requestingPlayerId, targetPlayerId } = message;

    // Get player information
    const getPlayerCommand = new GetCommand({
      TableName: 'PlayersTable',
      Key: { id: playerId },
    });
    const player = await docClient.send(getPlayerCommand);

    if (!player.Item) {
      throw new Error(`Player not found: ${playerId}`);
    }

    let emailSubject = '';
    let emailBody = '';
    let smsMessage = '';

    switch (type) {
      case 'SCHEDULE_UPDATE':
        emailSubject = 'Golf League Schedule Update';
        emailBody = `Hello ${player.Item.name},\n\nYour golf league schedule has been updated for week ${weekId}.\n\nTime: ${message.time}\nCourse: ${message.course}\n\nPlease log in to the Golf League Manager to view your updated schedule.\n\nBest regards,\nGolf League Manager`;
        smsMessage = `Golf League Update: Week ${weekId} - Time: ${message.time}, Course: ${message.course}`;
        break;

      case 'SWAP_REQUEST':
        const requestingPlayer = await docClient.send(new GetCommand({
          TableName: 'PlayersTable',
          Key: { id: requestingPlayerId },
        }));

        emailSubject = 'Golf League Swap Request';
        emailBody = `Hello ${player.Item.name},\n\n${requestingPlayer.Item.name} has requested to swap weeks with you for week ${weekId}.\n\nPlease log in to the Golf League Manager to accept or decline this request.\n\nBest regards,\nGolf League Manager`;
        smsMessage = `Swap Request: ${requestingPlayer.Item.name} wants to swap week ${weekId}`;
        break;

      case 'SWAP_ACCEPTED':
        const targetPlayer = await docClient.send(new GetCommand({
          TableName: 'PlayersTable',
          Key: { id: targetPlayerId },
        }));

        emailSubject = 'Golf League Swap Accepted';
        emailBody = `Hello ${player.Item.name},\n\nYour swap request with ${targetPlayer.Item.name} for week ${weekId} has been accepted.\n\nPlease log in to the Golf League Manager to view your updated schedule.\n\nBest regards,\nGolf League Manager`;
        smsMessage = `Swap Accepted: Your swap with ${targetPlayer.Item.name} for week ${weekId} is confirmed`;
        break;
    }

    // Send email
    const sendEmailCommand = new SendEmailCommand({
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [player.Item.email],
      },
      Message: {
        Subject: {
          Data: emailSubject,
        },
        Body: {
          Text: {
            Data: emailBody,
          },
        },
      },
    });
    await sesClient.send(sendEmailCommand);

    // Send SMS
    const publishCommand = new PublishCommand({
      TopicArn: process.env.SMS_TOPIC_ARN,
      Message: smsMessage,
      PhoneNumber: player.Item.phoneNumber,
    });
    await snsClient.send(publishCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notifications sent successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}; 