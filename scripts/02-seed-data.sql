-- Seed data for AI Phone Agent system
-- Inserts default knowledge base entries and system settings

-- Insert default knowledge base entries
INSERT OR IGNORE INTO knowledge_base (category, question, answer) VALUES
('company_info', 'What are your business hours?', 'We are open Monday through Friday from 9:00 AM to 6:00 PM EST. We are closed on weekends and major holidays.'),
('company_info', 'What is your phone number?', 'You can reach us at this number you just called, or visit our website for additional contact methods.'),
('company_info', 'Where are you located?', 'We are located in the United States. For specific address information, I can connect you with one of our team members.'),
('services', 'What services do you offer?', 'We offer a comprehensive range of business services. I can connect you with a specialist who can discuss your specific needs in detail.'),
('services', 'How much do your services cost?', 'Pricing varies based on your specific requirements. Let me connect you with one of our specialists who can provide detailed pricing information.'),
('general', 'How can I get a quote?', 'I can connect you with one of our specialists right now to discuss your needs and provide a quote. May I get your name and company information?'),
('general', 'Do you offer free consultations?', 'Yes, we offer free initial consultations. I can schedule one for you or connect you with a specialist right now.'),
('support', 'I need technical support', 'I can connect you with our technical support team. May I get your name and a brief description of the issue you are experiencing?');

-- Insert default system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('ai_system_prompt', 'You are a professional AI phone assistant for a business. Your primary goals are: 1) Qualify leads by gathering name, company, phone number, and reason for calling, 2) Answer questions using the knowledge base, 3) Filter spam calls, 4) Transfer calls to humans when needed. Be conversational, helpful, and professional. Always maintain context throughout the call.', 'Main system prompt for the AI agent'),
('business_hours_start', '09:00', 'Business opening time (24-hour format)'),
('business_hours_end', '18:00', 'Business closing time (24-hour format)'),
('business_days', 'monday,tuesday,wednesday,thursday,friday', 'Days of the week business is open'),
('transfer_sip_endpoint', 'sip:office@company.com', 'SIP endpoint for call transfers'),
('ntfy_topic', 'ai-phone-agent-notifications', 'ntfy.sh topic for notifications'),
('spam_threshold', '3', 'Number of spam reports before auto-blocking'),
('max_call_duration', '1800', 'Maximum call duration in seconds (30 minutes)'),
('voicemail_enabled', 'true', 'Whether to offer voicemail option');

-- Insert default admin user (password: admin123 - should be changed in production)
INSERT OR IGNORE INTO admin_users (username, password_hash, email) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LQ4YCOuLQv3c1yqBWVHxkd0LQ4YCOuLQv3c1yq', 'admin@company.com');
