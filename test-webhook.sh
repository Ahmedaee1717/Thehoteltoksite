#!/bin/bash
# Test Mailgun webhook with realistic data

curl -v -X POST "https://73755c15.investay-email-system.pages.dev/api/email/receive" \
  --form-string 'from=Ahmed Abou El-Enin <ahmed.enin@virgingates.com>' \
  --form-string 'recipient=test1@investaycapital.com' \
  --form-string 'subject=Test from script' \
  --form-string 'body-plain=This is a test email body' \
  --form-string 'body-html=<p>This is a test email body</p>' \
  --form-string 'message-id=CAO=1c=test123@mail.gmail.com' \
  --form-string 'timestamp=1735772871' \
  --form-string 'Message-Id=<CAO=1c=test123@mail.gmail.com>'
