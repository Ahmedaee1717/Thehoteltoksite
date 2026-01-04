#!/bin/bash
# Simulate EXACT Mailgun payload based on their documentation
curl -v -X POST 'https://63837085.investay-email-system.pages.dev/api/email/receive' \
  -F 'recipient=test1@investaycapital.com' \
  -F 'sender=ahmed.enin@virgingates.com' \
  -F 'from=Ahmed Abou El-Enin <ahmed.enin@virgingates.com>' \
  -F 'subject=Re: e' \
  -F 'Body-plain=This is the body text' \
  -F 'body-html=<p>This is the body html</p>' \
  -F 'stripped-text=This is stripped text' \
  -F 'stripped-html=<p>Stripped html</p>' \
  -F 'message-headers=[[\"From\", \"ahmed.enin@virgingates.com\"]]' \
  -F 'timestamp=1735772214' \
  -F 'token=abc123' \
  -F 'signature=def456' \
  -F 'Message-Id=<test@mail.gmail.com>'
