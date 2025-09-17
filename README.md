# AI Phone Agent System

A fully autonomous conversational AI agent for handling phone calls for small businesses, built with Next.js, Telnyx, and OpenAI.

## Features

- **Autonomous AI Agent**: Powered by OpenAI GPT-4 for natural conversations
- **Lead Qualification**: Automatically extracts caller information and qualifies leads
- **Spam Detection**: Intelligent filtering of spam and robocalls
- **Call Management**: Complete call logging, transcription, and history
- **Admin Dashboard**: Professional interface for managing calls and system settings
- **Knowledge Base**: Customizable Q&A system for common inquiries
- **Real-time Notifications**: Live updates for incoming calls and system events
- **Telnyx Integration**: Full telephony integration with call control
- **Business Hours**: Automatic after-hours handling and voicemail routing
- **Web-based Setup**: Easy configuration wizard for first-time setup

## Quick Start

### Prerequisites

- Node.js 18+
- Telnyx account with Call Control API access
- OpenAI API key

### Installation & Setup

1. **Clone and install dependencies:**
   \`\`\`bash
   git clone <repository-url>
   cd ai-phone-agent
   npm install
   \`\`\`

2. **Start the application:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Complete web-based setup:**
   - Visit http://localhost:3000
   - You'll be automatically redirected to the setup wizard
   - Follow the step-by-step configuration process:
     - Create admin account
     - Configure company information
     - Set up AI behavior and prompts
     - Enter API keys (Telnyx, OpenAI)
     - Enable desired features

4. **Configure Telnyx webhook:**
   - In your Telnyx portal, set webhook URL to: `https://your-domain.com/api/webhooks/telnyx`
   - Enable events: `call.initiated`, `call.answered`, `call.hangup`, `call.transcription`, `call.speak.ended`, `call.recording.saved`

## Deployment Options

### Option 1: Docker (Recommended)

\`\`\`bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t ai-phone-agent .
docker run -p 3000:3000 -v ./data:/app/data ai-phone-agent
\`\`\`

### Option 2: Direct Deployment

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start
\`\`\`

### Option 3: Systemd Service (Linux)

1. **Create service file:**
   \`\`\`bash
   sudo nano /etc/systemd/system/ai-phone-agent.service
   \`\`\`

2. **Add service configuration:**
   \`\`\`ini
   [Unit]
   Description=AI Phone Agent
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/ai-phone-agent
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=10
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   \`\`\`

3. **Enable and start service:**
   \`\`\`bash
   sudo systemctl daemon-reload
   sudo systemctl enable ai-phone-agent
   sudo systemctl start ai-phone-agent
   \`\`\`

## System Architecture

### Core Components

- **AI Agent Engine** (`lib/ai-agent.ts`): Conversation management and lead qualification
- **Call Session Manager** (`lib/call-session-manager.ts`): Coordinates between AI and telephony
- **Telnyx Client** (`lib/telnyx-client.ts`): Telephony service integration
- **Notification System** (`lib/notification-manager.ts`): Real-time alerts and updates
- **Database Layer** (`lib/database.ts`): SQLite-based data persistence
- **Setup System** (`app/setup/`): Web-based configuration wizard

### Admin Dashboard

- **Authentication**: Secure JWT-based login system
- **Call Logs**: Complete call history with transcripts and contact grouping
- **Knowledge Base**: Manage AI responses and business information
- **System Settings**: Configure business hours, AI prompts, and telephony settings
- **Real-time Monitoring**: Live call status and system health indicators
- **AI Agent Tester**: Test and debug AI responses

## Configuration

### Web-based Setup Wizard

The system includes a comprehensive setup wizard that configures:

1. **Admin Account**: Create your administrator credentials
2. **Company Information**: Business details, contact info, and hours
3. **AI Configuration**: System prompts, model selection, and behavior settings
4. **API Keys**: Secure storage of Telnyx and OpenAI credentials
5. **Features**: Enable/disable optional features like spam detection, call recording, etc.

### Manual Configuration (Advanced)

If you need to manually configure the system, create a `.env` file:

\`\`\`env
# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Telnyx Configuration
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_WEBHOOK_SECRET=your-webhook-secret

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_PATH=./data/database.db

# Setup Status
SETUP_COMPLETED=true
\`\`\`

## API Endpoints

### Setup
- `GET /api/setup/status` - Check setup completion status
- `POST /api/setup` - Complete initial system setup

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current user

### Call Management
- `GET /api/calls` - List call logs
- `GET /api/calls/[id]` - Get call details
- `POST /api/calls` - Create call log entry

### Knowledge Base
- `GET /api/knowledge` - List knowledge entries
- `POST /api/knowledge` - Create knowledge entry
- `PUT /api/knowledge/[id]` - Update knowledge entry
- `DELETE /api/knowledge/[id]` - Delete knowledge entry

### AI Testing
- `POST /api/ai/test` - Test AI agent responses

### System Status
- `GET /api/telnyx/status` - Check Telnyx integration status
- `POST /api/telnyx/test-call` - Create test call

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/stream` - SSE notification stream

### Webhooks
- `POST /api/webhooks/telnyx` - Telnyx webhook handler

## Security Features

- **JWT Authentication**: Secure admin access
- **Webhook Validation**: Cryptographic signature verification
- **Input Sanitization**: Protection against injection attacks
- **Secure Setup Process**: Encrypted storage of sensitive configuration
- **Environment Variable Protection**: API keys stored securely
- **HTTPS Enforcement**: SSL/TLS encryption for all communications

## Monitoring and Logging

- **System Health**: Real-time status monitoring
- **Call Analytics**: Detailed call metrics and reporting
- **Error Tracking**: Comprehensive error logging and alerts
- **Performance Metrics**: Response times and system performance
- **Setup Validation**: Automatic configuration verification

## Troubleshooting

### Common Issues

1. **Setup not completing**: Check browser console for errors and ensure all required fields are filled
2. **Telnyx webhook not working**: Verify webhook URL is accessible and HTTPS is enabled
3. **AI not responding**: Check OpenAI API key and ensure sufficient credits
4. **Database errors**: Ensure write permissions to the data directory

### Support

For technical support:
1. Check the admin dashboard system status
2. Review application logs: `docker logs ai-phone-agent` or `journalctl -u ai-phone-agent -f`
3. Verify Telnyx webhook configuration in the Telephony Status page
4. Use the AI Agent Tester to debug conversation issues
5. Ensure all environment variables are set correctly

## Development

### Local Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database setup (if needed)
npm run setup
\`\`\`

### Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── setup/             # Setup wizard
│   └── dashboard/         # Admin dashboard pages
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Core business logic
├── scripts/               # Database and deployment scripts
├── data/                  # SQLite database storage
└── public/                # Static assets
\`\`\`

## License

This project is proprietary software. All rights reserved.
