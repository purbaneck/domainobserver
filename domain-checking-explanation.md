## Domain Observer - Backend Architecture

### Overview
The Domain Observer application uses Supabase for both database storage and serverless functions to check domain availability. Here's how the system works:

### Database Structure
The application uses three main tables:
1. **domains** - Stores domain information and current status
2. **domain_checks** - Records historical check results
3. **profiles** - Stores user information including notification preferences

### Domain Checking Process

#### 1. Domain Storage
When a user adds a domain through the AddDomainModal component, it's stored in the `domains` table with:
- Initial status: "pending"
- User association via foreign key
- Notification preference

#### 2. Scheduled Checking
The system uses a Supabase Edge Function (`check-domains`) that:
- Runs on a schedule (likely daily)
- Prioritizes domains that have never been checked or haven't been checked recently
- Can also be triggered manually for specific domains

#### 3. Domain Availability Check
For each domain, the function:
- Calls a WHOIS API service to check domain availability
- Currently uses a mock implementation that would be replaced with a real WHOIS API in production
- Determines if the domain is "available", "taken", or "unknown" (if the check fails)

#### 4. Status Updates
After checking, the function:
- Updates the domain's status in the `domains` table
- Records the check result in the `domain_checks` table for historical tracking
- Timestamps when the check occurred

#### 5. Notification System
If a domain becomes available and the user has enabled notifications:
- The function checks if this is a status change from previously unavailable
- Retrieves the user's email from the profiles table
- Would send an email notification in production (currently just logs the action)

### Security
- Row Level Security (RLS) policies ensure users can only access their own domains and profile
- The Edge Function uses a service role key with elevated permissions to perform operations

### Technical Implementation
- The Edge Function is written in TypeScript and runs on Deno
- It uses the Supabase JavaScript client to interact with the database
- CORS headers are properly set to allow API access from the frontend
- Error handling is implemented to gracefully handle API failures
