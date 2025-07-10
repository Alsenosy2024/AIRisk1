# AI-Powered Risk Management Web Application

## Overview
An intelligent risk management platform that helps organizations track, analyze, and mitigate risks using AI-powered insights. The application provides comprehensive dashboard views, intelligent risk generation, and detailed reporting capabilities.

## Project Architecture
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth only (traditional login/register removed)
- **AI Integration**: OpenAI for risk analysis, generation, and insights
- **Email Service**: Nodemailer with Ethereal for development
- **Deployment**: Replit with automatic workflows

## Current Features
### Authentication & User Management
- Google OAuth authentication only
- Role-based access control (Admin, Risk Manager, Project Manager, Viewer)
- User session management with PostgreSQL session store

### Risk Management
- Risk register with CRUD operations
- AI-powered risk generation based on project descriptions
- Risk categorization (Technical, Financial, Operational, Security, Organizational, External)
- Risk severity levels (Critical, High, Medium, Low, Very Low)
- Risk status tracking (Identified, Needs Mitigation, In Progress, Mitigated, Closed, Accepted)
- Risk events and history tracking

### Project Management
- Multiple project support with consolidated dashboard views
- Project creation, editing, and management
- Project-specific risk isolation

### AI Features
- OpenAI integration for intelligent risk suggestions
- AI-powered mitigation plan generation
- Risk pattern analysis and insights
- Intelligent dashboard insights and recommendations

### Dashboard & Analytics
- Comprehensive risk overview with charts and visualizations
- Risk distribution by category, severity, and status
- Risk trend analysis and heatmaps
- AI-generated insights and action items
- Export functionality to PDF with complete dashboard data

### Reporting
- PDF export with cover page, table of contents, charts, and insights
- Executive summary generation
- Risk distribution analysis
- Top risks highlighting

## Recent Changes
**January 10, 2025**
- Simplified authentication to Google OAuth only
- Removed traditional login/register forms and backend routes
- Updated auth page to show only Google sign-in option
- Implemented dynamic redirect URL construction for Google OAuth to handle domain changes
- Enhanced error handling for OAuth flow with specific error messages

## User Preferences
- Simple, everyday language for communication
- Focus on essential features without overwhelming complexity
- Modern, Silicon Valley-inspired UI design
- Responsive design for mobile, tablet, and desktop
- Professional appearance with gradient effects and animations

## Technical Implementation Notes
### Database Schema
- Users table with Google OAuth support
- Projects table for multi-project support
- Risks table with comprehensive risk data
- Risk events for audit trail
- Insights table for AI-generated recommendations

### API Structure
- RESTful API design with `/api` prefix
- Protected routes using authentication middleware
- Role-based access control for sensitive operations
- Comprehensive error handling and logging

### Frontend Architecture
- React Router using Wouter for client-side navigation
- TanStack Query for server state management
- Form handling with react-hook-form and Zod validation
- Shadcn/ui components for consistent UI
- Tailwind CSS for styling with custom theme configuration

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL database connection
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `SESSION_SECRET`: Session encryption secret

## Deployment Status
- Configured for Replit deployment
- Workflow set up for automatic development server startup
- PostgreSQL database provisioned and configured
- Google OAuth configured with dynamic redirect URLs