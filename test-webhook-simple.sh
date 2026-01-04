#!/bin/bash
curl -s -X POST 'https://48837b6b.investay-email-system.pages.dev/api/email/receive' \
  -d 'from=test@example.com' \
  -d 'recipient=test1@investaycapital.com' \
  -d 'subject=Simple Test' \
  -d 'body-plain=Test body' \
  -d 'timestamp=1735772214'
