-- Sample CRM data for testing

-- Sample contacts for admin@investaycapital.com
INSERT INTO crm_contacts (user_email, name, email, phone, company, position, contact_type, notes) VALUES
('admin@investaycapital.com', 'John Smith', 'john.smith@techcorp.com', '+1-555-0101', 'TechCorp Inc', 'CTO', 'client', 'Key decision maker for enterprise deals'),
('admin@investaycapital.com', 'Sarah Johnson', 'sarah.j@startupco.io', '+1-555-0102', 'StartupCo', 'CEO', 'prospect', 'Interested in Series A investment'),
('admin@investaycapital.com', 'Michael Chen', 'mchen@globalventures.com', '+1-555-0103', 'Global Ventures', 'Partner', 'partner', 'Co-investment opportunities');

-- Sample contacts for test1@investaycapital.com
INSERT INTO crm_contacts (user_email, name, email, phone, company, position, contact_type) VALUES
('test1@investaycapital.com', 'Alice Williams', 'alice.w@example.com', '+1-555-0201', 'Example Corp', 'VP Sales', 'prospect'),
('test1@investaycapital.com', 'Bob Martinez', 'bob.m@testcompany.com', '+1-555-0202', 'Test Company', 'Director', 'client');

-- Sample deals for admin@investaycapital.com
INSERT INTO crm_deals (user_email, contact_id, title, value, stage, probability, close_date, notes)
SELECT 
  'admin@investaycapital.com',
  id,
  'TechCorp Enterprise License',
  250000,
  'negotiation',
  75,
  date('now', '+30 days'),
  'Final contract review in progress'
FROM crm_contacts WHERE email='john.smith@techcorp.com';

INSERT INTO crm_deals (user_email, contact_id, title, value, stage, probability, close_date, notes)
SELECT 
  'admin@investaycapital.com',
  id,
  'StartupCo Series A Investment',
  5000000,
  'qualified',
  60,
  date('now', '+60 days'),
  'Due diligence phase'
FROM crm_contacts WHERE email='sarah.j@startupco.io';

INSERT INTO crm_deals (user_email, contact_id, title, value, stage, probability, close_date, notes)
SELECT 
  'admin@investaycapital.com',
  id,
  'Co-investment Fund Partnership',
  10000000,
  'proposal',
  40,
  date('now', '+90 days'),
  'Term sheet sent'
FROM crm_contacts WHERE email='mchen@globalventures.com';

-- Sample deals for test1@investaycapital.com
INSERT INTO crm_deals (user_email, contact_id, title, value, stage, probability)
SELECT 
  'test1@investaycapital.com',
  id,
  'Example Corp Deal',
  75000,
  'lead',
  30
FROM crm_contacts WHERE email='alice.w@example.com';

INSERT INTO crm_deals (user_email, contact_id, title, value, stage, probability)
SELECT 
  'test1@investaycapital.com',
  id,
  'Test Company Renewal',
  50000,
  'proposal',
  80
FROM crm_contacts WHERE email='bob.m@testcompany.com';

-- Sample activities
INSERT INTO crm_activities (user_email, contact_id, deal_id, activity_type, subject, notes)
SELECT 
  'admin@investaycapital.com',
  c.id,
  d.id,
  'email',
  'Contract Discussion',
  'Sent updated contract terms'
FROM crm_contacts c, crm_deals d 
WHERE c.email='john.smith@techcorp.com' AND d.title='TechCorp Enterprise License';

INSERT INTO crm_activities (user_email, contact_id, deal_id, activity_type, subject, notes)
SELECT 
  'admin@investaycapital.com',
  c.id,
  d.id,
  'call',
  'Investment Discussion',
  '45-minute call discussing terms and timeline'
FROM crm_contacts c, crm_deals d 
WHERE c.email='sarah.j@startupco.io' AND d.title='StartupCo Series A Investment';

INSERT INTO crm_activities (user_email, contact_id, deal_id, activity_type, subject, notes)
SELECT 
  'admin@investaycapital.com',
  c.id,
  d.id,
  'meeting',
  'Partnership Strategy Meeting',
  'Quarterly strategy alignment meeting'
FROM crm_contacts c, crm_deals d 
WHERE c.email='mchen@globalventures.com' AND d.title='Co-investment Fund Partnership';
