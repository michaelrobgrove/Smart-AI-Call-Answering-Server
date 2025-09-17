#!/bin/bash

# AI Phone Agent Deployment Script
# This script sets up the AI phone agent system on a Linux server

set -e

echo "🤖 AI Phone Agent Deployment Script"
echo "=================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Create application directory
APP_DIR="/opt/ai-phone-agent"
echo "📁 Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Copy application files (assuming they're in current directory)
echo "📋 Copying application files..."
cp -r . $APP_DIR/

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/ai-phone-agent.service << EOF
[Unit]
Description=AI Phone Agent
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Create production server file
echo "🖥️  Creating production server..."
cat > $APP_DIR/server.js << 'EOF'
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> AI Phone Agent ready on http://${hostname}:${port}`)
  })
})
EOF

# Set permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data $APP_DIR
chmod +x $APP_DIR/server.js

# Initialize database
echo "🗄️  Initializing database..."
cd $APP_DIR
sudo -u www-data node -e "
const db = require('./lib/database.js');
console.log('Database initialized successfully');
"

# Enable and start service
echo "🚀 Starting AI Phone Agent service..."
systemctl daemon-reload
systemctl enable ai-phone-agent
systemctl start ai-phone-agent

# Install and configure nginx (optional)
read -p "Do you want to install and configure nginx as reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Installing nginx..."
  apt install -y nginx
  
  echo "⚙️  Configuring nginx..."
  cat > /etc/nginx/sites-available/ai-phone-agent << EOF
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/ai-phone-agent /etc/nginx/sites-enabled/
  nginx -t && systemctl restart nginx
  echo "✅ Nginx configured successfully"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "🎉 AI Phone Agent deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables:"
echo "   - JWT_SECRET=your-secret-key"
echo "   - TELNYX_API_KEY=your-telnyx-api-key"
echo "   - TELNYX_WEBHOOK_SECRET=your-webhook-secret"
echo ""
echo "2. Configure your domain in nginx (if installed)"
echo "3. Set up SSL certificate with Let's Encrypt"
echo "4. Configure Telnyx webhook URL: https://your-domain.com/api/webhooks/telnyx"
echo ""
echo "📊 Service status: systemctl status ai-phone-agent"
echo "📝 View logs: journalctl -u ai-phone-agent -f"
echo ""
echo "🌐 Access your AI Phone Agent at: http://your-server-ip"
