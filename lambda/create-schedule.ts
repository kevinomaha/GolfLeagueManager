import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const schedule = [
  // Kevin C (50%)
  { weekId: '2024-05-12', playerId: 'kevin.cory@mutualofomaha.com' },
  { weekId: '2024-05-19', playerId: 'kevin.cory@mutualofomaha.com' },
  { weekId: '2024-07-02', playerId: 'kevin.cory@mutualofomaha.com' },
  { weekId: '2024-07-23', playerId: 'kevin.cory@mutualofomaha.com' },

  // Jordan Hansen (50%)
  { weekId: '2024-05-12', playerId: 'jordanthansen97@gmail.com' },
  { weekId: '2024-05-19', playerId: 'jordanthansen97@gmail.com' },
  { weekId: '2024-07-09', playerId: 'jordanthansen97@gmail.com' },
  { weekId: '2024-07-16', playerId: 'jordanthansen97@gmail.com' },

  // Mark Boaz (50%)
  { weekId: '2024-04-28', playerId: 'Mark.Boaz@mutualofomaha.com' },
  { weekId: '2024-05-19', playerId: 'Mark.Boaz@mutualofomaha.com' },
  { weekId: '2024-07-02', playerId: 'Mark.Boaz@mutualofomaha.com' },
  { weekId: '2024-07-23', playerId: 'Mark.Boaz@mutualofomaha.com' },

  // Travis Lavine (25%)
  { weekId: '2024-04-28', playerId: 'Travis.Lavine@mutualofomaha.com' },
  { weekId: '2024-05-12', playerId: 'Travis.Lavine@mutualofomaha.com' },
  { weekId: '2024-07-16', playerId: 'Travis.Lavine@mutualofomaha.com' },
  { weekId: '2024-07-23', playerId: 'Travis.Lavine@mutualofomaha.com' },

  // Russell Avalon (50%)
  { weekId: '2024-04-28', playerId: 'russellavalon@gmail.com' },
  { weekId: '2024-05-19', playerId: 'russellavalon@gmail.com' },
  { weekId: '2024-07-16', playerId: 'russellavalon@gmail.com' },

  // Nolan Slimp (50%)
  { weekId: '2024-04-28', playerId: 'nolan.slimp@mutualofomaha.com' },
  { weekId: '2024-05-19', playerId: 'nolan.slimp@mutualofomaha.com' },
  { weekId: '2024-07-02', playerId: 'nolan.slimp@mutualofomaha.com' },
  { weekId: '2024-07-23', playerId: 'nolan.slimp@mutualofomaha.com' },

  // Ryan Wand (50%)
  { weekId: '2024-05-12', playerId: 'ryan.wand@mutualofomaha.com' },
  { weekId: '2024-05-19', playerId: 'ryan.wand@mutualofomaha.com' },
  { weekId: '2024-07-16', playerId: 'ryan.wand@mutualofomaha.com' },
  { weekId: '2024-07-23', playerId: 'ryan.wand@mutualofomaha.com' },

  // Bruce Barstow (0%)
  { weekId: '2024-05-12', playerId: 'bbarstow68@gmail.com' },
  { weekId: '2024-07-09', playerId: 'bbarstow68@gmail.com' },
  { weekId: '2024-07-16', playerId: 'bbarstow68@gmail.com' },
  { weekId: '2024-07-23', playerId: 'bbarstow68@gmail.com' },
];

async function createSchedule() {
  console.log('Creating schedule entries...\n');

  for (const entry of schedule) {
    try {
      const command = new PutCommand({
        TableName: 'GolfLeagueManagerStack-ScheduleTable6DED49F5-694JWNA8A468',
        Item: {
          ...entry,
          time: '5:30 PM',
          course: 'TBD',
        },
      });

      await docClient.send(command);
      console.log(`Created schedule entry: ${entry.weekId} - ${entry.playerId}`);
    } catch (error) {
      console.error(`Failed to create schedule entry:`, error);
    }
  }

  console.log('\nSchedule creation completed');
}

createSchedule(); 