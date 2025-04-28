# Golf League Management System
## Product Requirements Document

### Document Information
- **Document Title:** Golf League Management System PRD
- **Version:** 1.0
- **Date:** April 3, 2025
- **Status:** Draft

## 1. Introduction

### 1.1 Purpose
This document describes the requirements for the Golf League Management System, a web application to manage a golf league schedule, player swaps, scoring, and communications.

### 1.2 Scope
The system will support a 10-player golf league running from April 28th to August 18th, 2025, with 4 players scheduled each week. It will manage player schedules, facilitate swaps, track scores, and enable communications.

### 1.3 Definitions & Acronyms
- **League**: The golf league consisting of 10 players
- **Swap**: An exchange of scheduled playing dates between two players
- **Admin**: User with elevated privileges (Kevin Cory)
- **AWS**: Amazon Web Services
- **CDK**: Cloud Development Kit
- **SPA**: Single Page Application

## 2. Product Overview

### 2.1 Product Vision
A serverless web application that simplifies golf league management by providing scheduling, swap coordination, score tracking, and communication capabilities in a mobile-friendly interface.

### 2.2 Target Users
- Regular players (9 users)
- Administrator (1 user - Kevin Cory)

### 2.3 User Personas

#### 2.3.1 Regular Player
Players who need to view schedules, request swaps, record scores, and communicate with other players.

#### 2.3.2 Administrator
Kevin Cory, who needs to manage schedules, override swaps, send communications, and maintain the player directory.

## 3. Requirements

### 3.1 Functional Requirements

#### 3.1.1 Authentication & User Management
- **FR-1.1**: Users shall log in using email and password
- **FR-1.2**: System shall support up to 10 player accounts
- **FR-1.3**: Initial password shall be set to "Welcome123!" for all users
- **FR-1.4**: Users shall be able to view and edit their profile information
- **FR-1.5**: Users shall be able to view other players' contact information

#### 3.1.2 Schedule Management
- **FR-2.1**: System shall display the full league schedule from April 28th to August 18th, 2025
- **FR-2.2**: Each week shall have 4 players scheduled
- **FR-2.3**: Each week shall specify the golf course and tee time
- **FR-2.4**: Users shall be able to view their personal schedule
- **FR-2.5**: System shall track the number of weeks each player is scheduled

#### 3.1.3 Swap Management
- **FR-3.1**: Players shall be able to request swaps with specific proposed dates
- **FR-3.2**: Players shall be able to accept or reject swap requests
- **FR-3.3**: Players shall receive notifications for swap requests
- **FR-3.4**: Admin shall be able to override any swap request
- **FR-3.5**: System shall maintain a history of swap requests

#### 3.1.4 Score Tracking
- **FR-4.1**: System shall record scores for each player after games
- **FR-4.2**: System shall track win/loss records for each player
- **FR-4.3**: System shall display player statistics and leaderboards
- **FR-4.4**: Players shall be able to view historical performance

#### 3.1.5 Communications
- **FR-5.1**: System shall send automated email reminders for upcoming games
- **FR-5.2**: System shall support SMS notifications
- **FR-5.3**: Admin shall be able to send communications to all players or selected players
- **FR-5.4**: System shall notify players about swap requests and responses

#### 3.1.6 Admin Functions
- **FR-6.1**: Admin shall be able to create and edit weekly schedules
- **FR-6.2**: Admin shall be able to override swap requests
- **FR-6.3**: Admin shall be able to manage player information
- **FR-6.4**: Admin shall be able to reset player passwords

### 3.2 Non-Functional Requirements

#### 3.2.1 Security
- **NFR-1.1**: All communication shall be encrypted using HTTPS
- **NFR-1.2**: Authentication shall use JWT tokens with appropriate expiration
- **NFR-1.3**: Role-based access control shall restrict admin functions

#### 3.2.2 Performance
- **NFR-2.1**: Page load time shall be less than 2 seconds
- **NFR-2.2**: System shall support concurrent access by all 10 users

#### 3.2.3 Usability
- **NFR-3.1**: Interface shall be responsive and mobile-friendly
- **NFR-3.2**: System shall be accessible on major browsers (Chrome, Safari, Firefox, Edge)
- **NFR-3.3**: UI shall follow consistent design patterns

#### 3.2.4 Reliability
- **NFR-4.1**: System shall have 99.9% uptime
- **NFR-4.2**: Data shall be backed up daily

#### 3.2.5 Compatibility
- **NFR-5.1**: Application shall work on iOS and Android mobile devices
- **NFR-5.2**: Application shall work on desktop and tablet browsers

## 4. System Architecture

### 4.1 AWS Services
- **Authentication**: Amazon Cognito
- **Frontend Hosting**: Amazon S3 + CloudFront
- **API**: AWS AppSync (GraphQL)
- **Business Logic**: AWS Lambda
- **Database**: Amazon DynamoDB
- **Notifications**: Amazon SNS, Amazon SES
- **Infrastructure**: AWS CDK

(See `techspec.md` for detailed technical standards and practices.)

### 4.2 Data Models

#### 4.2.1 Player
```
{
  id: String (UUID),
  email: String,
  name: String,
  phone: String,
  weeksScheduled: Number,
  isAdmin: Boolean,
  totalWins: Number,
  totalLosses: Number
}
```

#### 4.2.2 Schedule
```
{
  id: String (UUID),
  date: String (ISO date),
  time: String,
  course: String,
  players: Array<PlayerId>,
  notes: String,
  isCompleted: Boolean
}
```

#### 4.2.3 SwapRequest
```
{
  id: String (UUID),
  requestorId: String (PlayerId),
  requestorWeekId: String (ScheduleId),
  targetId: String (PlayerId),
  targetWeekId: String (ScheduleId),
  proposedDate: String (ISO date),
  reason: String,
  status: String (PENDING, ACCEPTED, REJECTED, ADMIN_OVERRIDE),
  createdAt: String (ISO timestamp)
}
```

#### 4.2.4 Score
```
{
  id: String (UUID),
  scheduleId: String (ScheduleId),
  playerId: String (PlayerId),
  score: Number,
  result: String (WIN, LOSS, TIE),
  notes: String
}
```

### 4.3 Technical Approach
- **Frontend**: React SPA with Material-UI
- **API Layer**: GraphQL API (to avoid CORS issues)
- **Authentication**: JWT-based with Cognito
- **Data Storage**: DynamoDB with single-table design
- **Infrastructure**: AWS CDK for deployment automation

## 5. User Interface

### 5.1 Screens

#### 5.1.1 Login Screen
- Email and password fields
- Login button
- Password reset link

#### 5.1.2 Dashboard
- Upcoming games
- Personal schedule summary
- Pending swap requests
- Recent scores
- Performance stats

#### 5.1.3 Schedule View
- Calendar view of all games
- Player assignments
- Course information
- Filtering options

#### 5.1.4 Player Directory
- Player list with contact information
- Performance statistics
- Scheduled weeks

#### 5.1.5 Swap Management
- New swap request form
- Pending requests list
- Swap history
- Accept/reject actions

#### 5.1.6 Score Entry
- Score input form
- Historical scores
- Performance statistics
- Leaderboard

#### 5.1.7 Admin Panel
- Schedule management
- Swap override
- Communication tools
- User management

### 5.2 Mockups
[Mockups to be added in next revision]

## 6. Implementation Plan

### 6.1 Development Phases

#### 6.1.1 Phase 1: Core Functionality
- Authentication
- Player directory
- Basic schedule display

#### 6.1.2 Phase 2: Scheduling Features
- Detailed schedule management
- Swap request system
- Notifications

#### 6.1.3 Phase 3: Scoring System
- Score entry
- Statistics tracking
- Leaderboards

#### 6.1.4 Phase 4: Admin Features
- Admin panel
- Override capabilities
- Communication tools

### 6.2 Initial Setup

#### 6.2.1 User Accounts
Pre-populated Cognito User Pool with the following players:
1. Bruce Barstow <bbarstow68@gmail.com>
2. Russell Avalon <russellavalon@gmail.com>
3. Jordan Hansen <jordanthansen97@gmail.com>
4. Kevin Cory <kevin.cory@mutualofomaha.com> (Admin)
5. Ryan Wand <ryan.wand@mutualofomaha.com>
6. Travis Lavine <Travis.Lavine@mutualofomaha.com>
7. Mark Boaz <Mark.Boaz@mutualofomaha.com>
8. Nolan Slimp <nolan.slimp@mutualofomaha.com>
9. [Player 9 - To be added]
10. [Player 10 - To be added]

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: CORS issues between frontend and API
  - **Mitigation**: Use AppSync GraphQL API with appropriate configuration

- **Risk**: Authentication complexity
  - **Mitigation**: Leverage Cognito for standard auth patterns

- **Risk**: Data consistency for swap operations
  - **Mitigation**: Implement transaction guarantees in DynamoDB

### 7.2 User Adoption Risks
- **Risk**: User difficulty with swap system
  - **Mitigation**: Intuitive UI and clear instructions

- **Risk**: Resistance to score entry
  - **Mitigation**: Make score entry simple and gamified

## 8. Success Metrics

- 100% player participation in the system
- > 90% of swaps handled through the system
- All scores recorded within 24 hours of games
- Zero manual schedule maintenance required by admin

## 9. Approvals

- [ ] Project Sponsor
- [ ] Technical Lead
- [ ] User Representative

---

*End of Document*
