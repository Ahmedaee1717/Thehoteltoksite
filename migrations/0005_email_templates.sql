-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user ON email_templates(user_id);

-- Insert default email templates
INSERT OR IGNORE INTO email_templates (id, user_id, name, subject, body, category) VALUES
  ('tmpl_meeting_request', 'admin@investaycapital.com', 'Meeting Request', 'Meeting Request: [Topic]', 
   'Hi [Name], I would like to schedule a meeting to discuss [topic]. Would you be available on [date] at [time]? Best regards, [Your Name]', 
   'meetings'),
  
  ('tmpl_follow_up', 'admin@investaycapital.com', 'Follow Up', 'Following Up: [Subject]',
   'Hi [Name], I wanted to follow up on [previous topic]. Do you have any updates on this? Looking forward to hearing from you. Best regards, [Your Name]',
   'follow_up'),
   
  ('tmpl_thank_you', 'admin@investaycapital.com', 'Thank You', 'Thank You',
   'Hi [Name], Thank you for [specific action]. I really appreciate your help with this. Best regards, [Your Name]',
   'gratitude'),
   
  ('tmpl_intro', 'admin@investaycapital.com', 'Introduction', 'Introduction: [Name] to [Name]',
   'Hi [Name 1] and [Name 2], I wanted to introduce you both. [Name 1] is [description], and [Name 2] is [description]. I think you would benefit from connecting because [reason]. Best regards, [Your Name]',
   'networking');
