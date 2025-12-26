/**
 * Email Spam Score Checker
 * Analyzes email content for spam triggers and provides recommendations
 */

export interface SpamCheckResult {
  score: number; // 0-100 (lower is better)
  level: 'safe' | 'warning' | 'danger';
  issues: SpamIssue[];
  recommendations: string[];
  passed: boolean;
}

export interface SpamIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  found: string;
}

// Common spam trigger words and phrases
const SPAM_TRIGGERS = {
  high: [
    'free money', 'make money fast', 'get rich', 'earn $$$', 'work from home',
    'click here now', 'limited time', 'act now', 'buy now', 'order now',
    'congratulations', 'you\'re a winner', 'claim your prize', 'guaranteed',
    'no credit check', 'cash bonus', 'extra income', 'viagra', 'cialis',
    '100% free', 'risk-free', 'no risk', 'best price', 'lowest price'
  ],
  medium: [
    'free', 'urgent', 'important', 'opportunity', 'deal', 'offer',
    'discount', 'save money', 'click here', 'subscribe', 'unsubscribe',
    'winner', 'bonus', 'gift', 'prize', 'money back', 'refund'
  ],
  low: [
    'check', 'update', 'verify', 'confirm', 'download', 'register',
    'apply', 'order', 'buy', 'shop', 'sale', 'limited'
  ]
};

/**
 * Check email content for spam indicators
 */
export function checkSpamScore(subject: string, body: string, html?: string): SpamCheckResult {
  const issues: SpamIssue[] = [];
  let score = 0;
  const recommendations: string[] = [];

  const fullText = `${subject} ${body}`.toLowerCase();
  const fullHtml = html?.toLowerCase() || '';

  // 1. Check for spam trigger words
  SPAM_TRIGGERS.high.forEach(trigger => {
    if (fullText.includes(trigger.toLowerCase())) {
      score += 15;
      issues.push({
        type: 'spam_trigger',
        severity: 'high',
        message: `High-risk spam trigger found: "${trigger}"`,
        found: trigger
      });
    }
  });

  SPAM_TRIGGERS.medium.forEach(trigger => {
    if (fullText.includes(trigger.toLowerCase())) {
      score += 5;
      issues.push({
        type: 'spam_trigger',
        severity: 'medium',
        message: `Medium-risk spam trigger found: "${trigger}"`,
        found: trigger
      });
    }
  });

  SPAM_TRIGGERS.low.forEach(trigger => {
    if (fullText.includes(trigger.toLowerCase())) {
      score += 2;
      issues.push({
        type: 'spam_trigger',
        severity: 'low',
        message: `Low-risk spam trigger found: "${trigger}"`,
        found: trigger
      });
    }
  });

  // 2. Check for excessive capitalization
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5) {
    score += 10;
    issues.push({
      type: 'capitalization',
      severity: 'medium',
      message: 'Subject line has excessive capitalization',
      found: `${Math.round(capsRatio * 100)}% capitals`
    });
    recommendations.push('Reduce capital letters in subject line to under 30%');
  }

  // 3. Check for excessive exclamation marks
  const exclamationCount = (fullText.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    score += 8;
    issues.push({
      type: 'punctuation',
      severity: 'medium',
      message: 'Too many exclamation marks',
      found: `${exclamationCount} exclamation marks`
    });
    recommendations.push('Limit exclamation marks to 1-2 per email');
  }

  // 4. Check for suspicious links
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = fullText.match(urlPattern) || [];
  if (urls.length > 10) {
    score += 12;
    issues.push({
      type: 'links',
      severity: 'high',
      message: 'Too many links in email',
      found: `${urls.length} links`
    });
    recommendations.push('Reduce number of links to under 5 for better deliverability');
  }

  // 5. Check for suspicious domains in links
  const suspiciousDomains = ['.tk', '.ml', '.ga', '.cf', 'bit.ly', 'tinyurl'];
  urls.forEach(url => {
    suspiciousDomains.forEach(domain => {
      if (url.includes(domain)) {
        score += 10;
        issues.push({
          type: 'suspicious_link',
          severity: 'high',
          message: 'Link contains suspicious domain',
          found: url.substring(0, 50)
        });
      }
    });
  });

  // 6. Check text-to-link ratio
  const textLength = body.length;
  const linkLength = urls.reduce((sum, url) => sum + url.length, 0);
  if (textLength > 0 && (linkLength / textLength) > 0.3) {
    score += 8;
    issues.push({
      type: 'text_ratio',
      severity: 'medium',
      message: 'Link-to-text ratio is too high',
      found: `${Math.round((linkLength / textLength) * 100)}% links`
    });
    recommendations.push('Add more text content relative to links (aim for <20% link content)');
  }

  // 7. Check for missing plain text (HTML-only emails are suspicious)
  if (html && !body) {
    score += 5;
    issues.push({
      type: 'format',
      severity: 'low',
      message: 'Email is HTML-only (no plain text version)',
      found: 'HTML-only'
    });
    recommendations.push('Include a plain text version alongside HTML for better deliverability');
  }

  // 8. Check for overly short subject
  if (subject.length < 10) {
    score += 3;
    issues.push({
      type: 'subject',
      severity: 'low',
      message: 'Subject line is too short',
      found: `${subject.length} characters`
    });
    recommendations.push('Use a more descriptive subject line (15-60 characters)');
  }

  // 9. Check for overly long subject
  if (subject.length > 78) {
    score += 5;
    issues.push({
      type: 'subject',
      severity: 'medium',
      message: 'Subject line is too long (may be truncated)',
      found: `${subject.length} characters`
    });
    recommendations.push('Keep subject line under 60 characters for better readability');
  }

  // 10. Check for dollar signs
  const dollarCount = (fullText.match(/\$/g) || []).length;
  if (dollarCount > 5) {
    score += 7;
    issues.push({
      type: 'content',
      severity: 'medium',
      message: 'Excessive use of dollar signs',
      found: `${dollarCount} dollar signs`
    });
    recommendations.push('Reduce use of dollar signs to avoid looking promotional');
  }

  // 11. Check for image-only emails
  if (fullHtml.includes('<img') && fullText.length < 100) {
    score += 12;
    issues.push({
      type: 'format',
      severity: 'high',
      message: 'Email appears to be mostly images with little text',
      found: 'Image-heavy content'
    });
    recommendations.push('Add more text content - image-only emails are often flagged as spam');
  }

  // 12. Check for missing unsubscribe link
  if (!fullText.includes('unsubscribe') && !fullHtml.includes('unsubscribe')) {
    score += 10;
    issues.push({
      type: 'compliance',
      severity: 'high',
      message: 'Missing unsubscribe link (CAN-SPAM violation)',
      found: 'No unsubscribe'
    });
    recommendations.push('Add an unsubscribe link (required by law)');
  }

  // Determine spam level
  let level: 'safe' | 'warning' | 'danger' = 'safe';
  if (score >= 50) {
    level = 'danger';
    recommendations.unshift('⚠️ HIGH SPAM RISK - Do not send until issues are resolved');
  } else if (score >= 25) {
    level = 'warning';
    recommendations.unshift('⚠️ MODERATE SPAM RISK - Consider revising before sending');
  } else {
    recommendations.unshift('✅ LOW SPAM RISK - Email looks good to send');
  }

  return {
    score: Math.min(100, score),
    level,
    issues,
    recommendations,
    passed: score < 25
  };
}

/**
 * Sanitize email content to remove spam triggers
 */
export function sanitizeEmailContent(text: string): string {
  let sanitized = text;

  // Replace high-risk spam phrases
  SPAM_TRIGGERS.high.forEach(trigger => {
    const regex = new RegExp(trigger, 'gi');
    sanitized = sanitized.replace(regex, '[content removed]');
  });

  // Remove excessive punctuation
  sanitized = sanitized.replace(/!{2,}/g, '!');
  sanitized = sanitized.replace(/\?{2,}/g, '?');
  sanitized = sanitized.replace(/\.{4,}/g, '...');

  return sanitized;
}

/**
 * Get spam score summary
 */
export function getSpamScoreSummary(result: SpamCheckResult): string {
  const emoji = result.level === 'safe' ? '✅' : result.level === 'warning' ? '⚠️' : '🚫';
  return `${emoji} Spam Score: ${result.score}/100 (${result.level.toUpperCase()})`;
}
