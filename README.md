<div align="center">

# 🤖 AI Phone Agent System

**The Ultimate Autonomous Conversational AI for Small Business Phone Management**

*Transform your business phone system with intelligent AI that never sleeps, never misses a call, and always delivers professional customer service.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Telnyx](https://img.shields.io/badge/Telnyx-API-green?style=for-the-badge)](https://telnyx.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?style=for-the-badge&logo=openai)](https://openai.com/)

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📖 Documentation](#-api-documentation) • [🛠️ Deployment](#-deployment-options)

</div>

---

## 🎯 What Makes This Special?

This isn't just another chatbot. It's a **complete business phone system** powered by cutting-edge AI that:

- **Handles calls like a human** - Natural conversations that feel authentic
- **Qualifies leads automatically** - Extracts contact info and business needs
- **Never misses opportunities** - 24/7 availability with intelligent routing
- **Learns your business** - Customizable knowledge base and responses
- **Protects from spam** - Advanced filtering and call screening
- **Scales effortlessly** - From startup to enterprise, handles any volume

## ✨ Features That Drive Results

### 🧠 **Intelligent AI Agent**
- **GPT-4 Powered Conversations** - Natural, context-aware interactions
- **Lead Qualification Engine** - Automatically captures and scores prospects
- **Smart Call Routing** - Handles inquiries, appointments, and transfers
- **Multilingual Support** - Communicate in your customers' preferred language

### 📊 **Professional Dashboard**
- **Real-time Call Monitoring** - Live call status and agent performance
- **Comprehensive Analytics** - Call metrics, conversion rates, and insights
- **Contact Management** - Organized lead database with interaction history
- **Knowledge Base Editor** - Easy-to-use Q&A management system

### 🔧 **Enterprise-Grade Features**
- **Business Hours Management** - Automatic after-hours and holiday handling
- **Call Recording & Transcription** - Full conversation logs for compliance
- **Webhook Integrations** - Connect to CRM, email marketing, and more
- **Advanced Spam Protection** - AI-powered robocall detection and blocking

### 🚀 **Developer-Friendly**
- **One-Click Setup Wizard** - No technical expertise required
- **Docker Support** - Deploy anywhere in minutes
- **RESTful API** - Integrate with existing business systems
- **Real-time Notifications** - SSE-powered live updates

## 🚀 Quick Start

### ⚡ **Option 1: Docker (Recommended)**

Get up and running in under 5 minutes:

\`\`\`bash
# Clone the repository
git clone https://github.com/your-org/ai-phone-agent.git
cd ai-phone-agent

# Start with Docker Compose
docker-compose up -d

# Visit http://localhost:3000 and follow the setup wizard!
\`\`\`

### 🛠️ **Option 2: Manual Installation**

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Complete setup at http://localhost:3000
\`\`\`

### 📋 **Prerequisites**

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Telnyx Account** - [Sign up for free](https://telnyx.com/) (Call Control API access)
- **OpenAI API Key** - [Get your key](https://platform.openai.com/api-keys)

## 🎨 Setup Wizard Experience

Our **intelligent setup wizard** makes configuration effortless:

### Step 1: 👤 **Create Your Admin Account**
- Secure administrator credentials
- Password recovery email setup
- Multi-factor authentication options

### Step 2: 🏢 **Configure Your Business**
- Company information and branding
- Business hours and timezone
- Contact details and addresses

### Step 3: 🤖 **Customize Your AI Agent**
- Personality and conversation style
- Industry-specific knowledge base
- Lead qualification criteria
- Custom response templates

### Step 4: 🔑 **Connect Your Services**
- Telnyx telephony integration
- OpenAI API configuration
- Optional third-party integrations

### Step 5: ✅ **Launch & Test**
- Automated system validation
- Test call functionality
- Webhook configuration verification

## 🏗️ System Architecture

\`\`\`mermaid
graph TB
    A[Incoming Call] --> B[Telnyx API]
    B --> C[AI Phone Agent]
    C --> D[OpenAI GPT-4]
    C --> E[Knowledge Base]
    C --> F[Lead Qualification]
    F --> G[Admin Dashboard]
    G --> H[Real-time Notifications]
    C --> I[Call Logging]
    I --> J[SQLite Database]
\`\`\`

### 🔧 **Core Components**

| Component | Purpose | Technology |
|-----------|---------|------------|
| **AI Agent Engine** | Conversation management & lead qualification | OpenAI GPT-4, Custom prompts |
| **Call Session Manager** | Coordinates AI and telephony systems | Node.js, WebSocket |
| **Telnyx Integration** | Voice communication and call control | Telnyx Call Control API |
| **Admin Dashboard** | Management interface and analytics | Next.js, React, TypeScript |
| **Notification System** | Real-time alerts and updates | Server-Sent Events (SSE) |
| **Database Layer** | Data persistence and analytics | SQLite with migrations |

## 🛠️ Deployment Options

### 🐳 **Production Docker Deployment**

\`\`\`bash
# Production-ready deployment
docker build -t ai-phone-agent:latest .
docker run -d \
  --name ai-phone-agent \
  -p 3000:3000 \
  -v ./data:/app/data \
  --restart unless-stopped \
  ai-phone-agent:latest
\`\`\`

### ☁️ **Cloud Deployment**

#### **Vercel (Recommended for Next.js)**
\`\`\`bash
# Deploy to Vercel
npm install -g vercel
vercel --prod
\`\`\`

#### **Railway**
\`\`\`bash
# One-click deploy to Railway
railway login
railway deploy
\`\`\`

#### **DigitalOcean App Platform**
- Connect your GitHub repository
- Set environment variables
- Deploy with automatic scaling

### 🖥️ **Self-Hosted Linux Server**

\`\`\`bash
# Create systemd service
sudo nano /etc/systemd/system/ai-phone-agent.service

# Service configuration
[Unit]
Description=AI Phone Agent System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ai-phone-agent
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ai-phone-agent
sudo systemctl start ai-phone-agent
\`\`\`

## 📖 API Documentation

### 🔐 **Authentication Endpoints**
\`\`\`typescript
POST /api/auth/login      // Admin login
POST /api/auth/logout     // Admin logout  
GET  /api/auth/me         // Current user info
\`\`\`

### 📞 **Call Management**
\`\`\`typescript
GET    /api/calls         // List all calls with filters
GET    /api/calls/[id]    // Detailed call information
POST   /api/calls         // Create new call log
PUT    /api/calls/[id]    // Update call details
DELETE /api/calls/[id]    // Archive call record
\`\`\`

### 🧠 **Knowledge Base**
\`\`\`typescript
GET    /api/knowledge     // List Q&A entries
POST   /api/knowledge     // Create new entry
PUT    /api/knowledge/[id] // Update existing entry
DELETE /api/knowledge/[id] // Remove entry
\`\`\`

### 🤖 **AI Agent Testing**
\`\`\`typescript
POST /api/ai/test         // Test AI responses
POST /api/ai/chat         // Direct AI conversation
\`\`\`

### 📊 **System Monitoring**
\`\`\`typescript
GET /api/telnyx/status    // Telephony system health
GET /api/notifications    // System notifications
GET /api/notifications/stream // Real-time SSE stream
\`\`\`

## 🔒 Security & Compliance

### 🛡️ **Security Features**
- **JWT Authentication** with secure token rotation
- **Webhook Signature Verification** for Telnyx integration
- **Input Sanitization** preventing injection attacks
- **Encrypted Configuration Storage** for sensitive data
- **HTTPS Enforcement** for all communications
- **Rate Limiting** to prevent abuse

### 📋 **Compliance Ready**
- **Call Recording Compliance** with consent management
- **Data Retention Policies** configurable retention periods
- **GDPR Support** with data export and deletion
- **HIPAA Considerations** for healthcare applications
- **Audit Logging** comprehensive activity tracking

## 📊 Monitoring & Analytics

### 📈 **Built-in Analytics**
- **Call Volume Metrics** - Daily, weekly, monthly trends
- **Lead Conversion Rates** - Track qualification success
- **Response Time Analysis** - AI performance monitoring
- **Customer Satisfaction** - Call quality scoring
- **System Health Dashboards** - Uptime and performance

### 🚨 **Alert System**
- **Failed Call Notifications** - Immediate error alerts
- **High Volume Warnings** - Capacity planning alerts
- **Integration Status** - Service connectivity monitoring
- **Performance Degradation** - Proactive issue detection

## 🔧 Troubleshooting Guide

### ❓ **Common Issues & Solutions**

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Setup Won't Complete** | Wizard hangs or errors | Check browser console, verify all fields filled |
| **Calls Not Connecting** | No incoming calls received | Verify Telnyx webhook URL and HTTPS certificate |
| **AI Not Responding** | Silent calls or errors | Check OpenAI API key and account credits |
| **Database Errors** | Setup or logging failures | Ensure write permissions to `/data` directory |
| **Webhook Failures** | Telnyx events not processing | Verify webhook secret and endpoint accessibility |

### 🔍 **Debug Mode**

Enable detailed logging for troubleshooting:

\`\`\`bash
# Set debug environment
export DEBUG=ai-phone-agent:*
export LOG_LEVEL=debug

# Start with verbose logging
npm run dev
\`\`\`

### 📞 **Support Channels**

1. **System Status Dashboard** - Check real-time system health
2. **Application Logs** - `docker logs ai-phone-agent -f`
3. **AI Agent Tester** - Debug conversation flows
4. **Webhook Validator** - Test Telnyx integration
5. **Community Forum** - [GitHub Discussions](https://github.com/your-org/ai-phone-agent/discussions)

## 🚀 Advanced Configuration

### 🎛️ **Environment Variables**

\`\`\`bash
# Core Configuration
JWT_SECRET=your-super-secure-jwt-secret
NODE_ENV=production
PORT=3000

# Telnyx Integration
TELNYX_API_KEY=your-telnyx-api-key
TELNYX_WEBHOOK_SECRET=your-webhook-secret

# OpenAI Configuration  
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# Database
DATABASE_PATH=./data/database.db
DATABASE_BACKUP_ENABLED=true

# Features
CALL_RECORDING_ENABLED=true
SPAM_DETECTION_ENABLED=true
ANALYTICS_ENABLED=true

# Setup Status
SETUP_COMPLETED=false
\`\`\`

### 🔧 **Custom Integrations**

Extend functionality with webhooks:

\`\`\`typescript
// Custom webhook handler
app.post('/api/webhooks/custom', async (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'call.qualified':
      await sendToCRM(data.lead);
      break;
    case 'call.completed':
      await updateAnalytics(data.metrics);
      break;
  }
  
  res.json({ success: true });
});
\`\`\`

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🛠️ **Development Setup**

\`\`\`bash
# Fork and clone the repository
git clone https://github.com/your-username/ai-phone-agent.git
cd ai-phone-agent

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
\`\`\`

### 📝 **Contribution Guidelines**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

---

<div align="center">

**Ready to revolutionize your business phone system?**

[🚀 Get Started Now](#-quick-start) • [📖 Read the Docs](#-api-documentation) • [💬 Join Community](https://github.com/your-org/ai-phone-agent/discussions)

*Built with ❤️ for small businesses who deserve enterprise-grade phone systems*

</div>
