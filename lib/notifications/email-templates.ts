/**
 * Email Templates for Shift Reminders
 * 
 * To enable email sending, configure Resend:
 * 1. Sign up at resend.com
 * 2. Add RESEND_API_KEY to .env
 * 3. npm install resend
 * 4. Uncomment email sending code in notification-service.ts
 */

interface ShiftReminderData {
  recipientEmail: string;
  recipientName: string;
  minutesBefore: number;
  shiftTime: string;
  timeSlot: string;
  dayOfWeek: string;
}

const TIME_LABELS: Record<number, string> = {
  120: '2 uur',
  60: '1 uur',
  30: '30 minuten',
  15: '15 minuten',
  10: '10 minuten',
  5: '5 minuten',
  0: 'nu'
};

const DAY_LABELS: Record<number, string> = {
  0: 'zondag',
  1: 'maandag',
  2: 'dinsdag',
  3: 'woensdag',
  4: 'donderdag',
  5: 'vrijdag',
  6: 'zaterdag'
};

const TIMESLOT_LABELS: Record<string, string> = {
  'morning': 'ochtend',
  'afternoon': 'middag',
  'evening': 'avond'
};

export function renderShiftReminderEmail(data: ShiftReminderData): string {
  const timeLabel = TIME_LABELS[data.minutesBefore] || `${data.minutesBefore} minuten`;
  const isUrgent = data.minutesBefore <= 5;
  const dayName = DAY_LABELS[parseInt(data.dayOfWeek)] || 'vandaag';
  const slotName = TIMESLOT_LABELS[data.timeSlot] || data.timeSlot;

  const brandColor = '#10b981'; // emerald-500
  const urgentColor = '#ef4444'; // red-500
  const bgColor = isUrgent ? urgentColor : brandColor;

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Herinnering - HomeCheff</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, ${bgColor} 0%, ${isUrgent ? '#dc2626' : '#14b8a6'} 100%);
      color: white;
      padding: 40px 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 20px;
      opacity: 0.95;
    }
    .content {
      background: white;
      padding: 40px 30px;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .content h2 {
      color: #1f2937;
      margin: 0 0 20px 0;
      font-size: 22px;
    }
    .content p {
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 20px 0;
      font-size: 16px;
    }
    .info-box {
      background: ${isUrgent ? '#fef2f2' : '#f0fdf4'};
      border-left: 4px solid ${bgColor};
      padding: 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    .info-box strong {
      color: ${isUrgent ? '#991b1b' : '#166534'};
      font-size: 18px;
      display: block;
      margin-bottom: 8px;
    }
    .info-box span {
      color: ${isUrgent ? '#7f1d1d' : '#14532d'};
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${bgColor} 0%, ${isUrgent ? '#dc2626' : '#14b8a6'} 100%);
      color: white !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .urgent-banner {
      background: ${urgentColor};
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      margin: 20px 0;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .tips {
      background: #eff6ff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .tips h3 {
      color: #1e40af;
      margin: 0 0 12px 0;
      font-size: 16px;
    }
    .tips ul {
      margin: 0;
      padding-left: 20px;
      color: #1e3a8a;
    }
    .tips li {
      margin: 8px 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isUrgent ? '🚨' : '⏰'} Shift Herinnering</h1>
      <p>${isUrgent ? 'Je shift begint bijna!' : `Over ${timeLabel}`}</p>
    </div>
    
    <div class="content">
      <h2>Hallo ${data.recipientName}!</h2>
      
      ${isUrgent ? `
        <div class="urgent-banner">
          ⚠️ JE SHIFT BEGINT ${data.minutesBefore === 0 ? 'NU' : `OVER ${timeLabel.toUpperCase()}`}!
        </div>
      ` : ''}
      
      <p>
        ${isUrgent 
          ? `Het is bijna tijd! Je ${slotName}shift begint ${data.minutesBefore === 0 ? 'nu' : `over ${timeLabel}`}. Ga nu online om orders te ontvangen.`
          : `Dit is een vriendelijke herinnering dat je ${slotName}shift ${dayName} begint over ${timeLabel}.`
        }
      </p>
      
      <div class="info-box">
        <strong>📅 Shift Details</strong>
        <span>
          <br>Dag: ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}
          <br>Tijd: ${data.shiftTime}
          <br>Type: ${slotName.charAt(0).toUpperCase() + slotName.slice(1)}shift
        </span>
      </div>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_URL}/bezorger?action=go-online" class="button">
          ${isUrgent ? '🟢 GA NU ONLINE' : '🚴 Naar Dashboard'}
        </a>
      </div>
      
      ${!isUrgent ? `
        <div class="tips">
          <h3>💡 Tips voor je shift:</h3>
          <ul>
            <li>Controleer je bezorgmiddel en uitrusting</li>
            <li>Zorg dat je telefoon opgeladen is</li>
            <li>Heb je thuis-/werkadres ingesteld in je profiel</li>
            <li>Ga 5 minuten voor je shift online</li>
          </ul>
        </div>
      ` : ''}
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Veel succes met bezorgen! Als je deze herinnering niet meer wilt ontvangen, 
        kun je je notificatie-instellingen aanpassen in je bezorgersprofiel.
      </p>
    </div>
    
    <div class="footer">
      <p>
        <strong>HomeCheff Bezorger Platform</strong><br>
        Lokale bezorgingen, door de buurt voor de buurt
      </p>
      <p style="margin-top: 15px;">
        <a href="${process.env.NEXT_PUBLIC_URL}/bezorger" style="color: #10b981; text-decoration: none;">Dashboard</a> • 
        <a href="${process.env.NEXT_PUBLIC_URL}/bezorger/settings" style="color: #10b981; text-decoration: none;">Instellingen</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getShiftReminderSubject(minutesBefore: number): string {
  if (minutesBefore === 0) {
    return '🚨 Je shift begint nu!';
  } else if (minutesBefore === 5) {
    return '🚨 Je shift begint over 5 minuten!';
  } else if (minutesBefore === 10) {
    return '⏰ Je shift begint over 10 minuten';
  } else if (minutesBefore === 15) {
    return '⏰ Je shift begint over 15 minuten';
  } else if (minutesBefore === 30) {
    return '⏰ Je shift begint over 30 minuten';
  } else if (minutesBefore === 60) {
    return '⏰ Je shift begint over 1 uur';
  } else if (minutesBefore === 120) {
    return '⏰ Je shift begint over 2 uur';
  }
  return `⏰ Shift herinnering - ${minutesBefore} minuten`;
}

// Example usage for email sending (when Resend is configured):
/*
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'HomeCheff <notificaties@homecheff.nl>',
  to: recipientEmail,
  subject: getShiftReminderSubject(minutesBefore),
  html: renderShiftReminderEmail({
    recipientEmail,
    recipientName,
    minutesBefore,
    shiftTime,
    timeSlot,
    dayOfWeek
  })
});
*/

