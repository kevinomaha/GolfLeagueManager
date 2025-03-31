import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const players = [
  {
    id: 'kevin.cory@mutualofomaha.com',
    name: 'Kevin C',
    email: 'kevin.cory@mutualofomaha.com',
    percentage: 50
  },
  {
    id: 'jordanthansen97@gmail.com',
    name: 'Jordan Hansen',
    email: 'jordanthansen97@gmail.com',
    percentage: 50
  },
  {
    id: 'Mark.Boaz@mutualofomaha.com',
    name: 'Mark Boaz',
    email: 'Mark.Boaz@mutualofomaha.com',
    percentage: 50
  },
  {
    id: 'Travis.Lavine@mutualofomaha.com',
    name: 'Travis Lavine',
    email: 'Travis.Lavine@mutualofomaha.com',
    percentage: 25
  },
  {
    id: 'russellavalon@gmail.com',
    name: 'Russell Avalon',
    email: 'russellavalon@gmail.com',
    percentage: 50
  },
  {
    id: 'nolan.slimp@mutualofomaha.com',
    name: 'Nolan Slimp',
    email: 'nolan.slimp@mutualofomaha.com',
    percentage: 50
  },
  {
    id: 'ryan.wand@mutualofomaha.com',
    name: 'Ryan Wand',
    email: 'ryan.wand@mutualofomaha.com',
    percentage: 50
  },
  {
    id: 'bbarstow68@gmail.com',
    name: 'Bruce Barstow',
    email: 'bbarstow68@gmail.com',
    percentage: 0
  }
];

async function updatePlayers() {
  console.log('Updating players...\n');

  for (const player of players) {
    try {
      const command = new PutCommand({
        TableName: 'GolfLeagueManagerStack-PlayersTable70A03D78-GGODEQQXFP7R',
        Item: player
      });

      await docClient.send(command);
      console.log(`Updated player: ${player.name} (${player.percentage}%)`);
    } catch (error) {
      console.error(`Failed to update player:`, error);
    }
  }

  console.log('\nPlayer updates completed');
}

updatePlayers(); 