import { Subscription } from '../types';
import { formatCurrency } from './currencyUtils';
import { formatDate, getDaysUntil } from './dateUtils';

export function generateWhatsAppMessage(
  sub: Subscription,
  lang: 'en' | 'hi' = 'en',
  recipientName?: string
): string {
  const days = getDaysUntil(sub.renewalDate);
  const formattedAmount = formatCurrency(sub.amount, sub.currency);
  const formattedDate = formatDate(sub.renewalDate);
  const name = recipientName ? recipientName.trim() : 'Sir/Madam';


  if (lang === 'hi') {
    let urgency = `आपकी ${sub.serviceName} सदस्यता का नवीनीकरण ${formattedDate} को देय है (${days > 0 ? `${days} दिन शेष` : days === 0 ? 'आज ही देय है' : 'देय तिथि बीत चुकी है'}).`;
    if (days < 0) {
      urgency = `⚠️ *अति आवश्यक सूचना:* आपकी ${sub.serviceName} सदस्यता का नवीनीकरण अतिदेय (Overdue) है!`;
    }

    return `*मोती रिन्यू (Moti Technologies) - नवीनीकरण रिमाइंडर* 🔔\n\n` +
      `नमस्ते ${name},\n\n` +
      `${urgency}\n\n` +
      `📌 *सदस्यता विवरण:*\n` +
      `• सेवा: *${sub.serviceName}* (${sub.providerName || sub.category})\n` +
      `• राशि: *${formattedAmount}*\n` +
      `• नवीनीकरण तिथि: *${formattedDate}*\n` +
      `• बिलिंग चक्र: *${sub.billingCycle}*\n` +
      `• भुगतान माध्यम: *${sub.paymentMethod}*\n` +
      (sub.notes ? `• नोट: ${sub.notes}\n` : '') +
      `\nअबाधित सेवा के लिए कृपया समय पर भुगतान पूर्ण करें।\n` +
      `_मोती टेक्नोलॉजीज द्वारा पावर्ड._`;
  }

  // Default: English
  let urgency = `Your subscription for ${sub.serviceName} is due for renewal on ${formattedDate} (${days > 0 ? `${days} day${days === 1 ? '' : 's'} remaining` : days === 0 ? 'Due Today' : `Overdue by ${Math.abs(days)} day(s)`}).`;
  if (days < 0) {
    urgency = `⚠️ *URGENT ALERT:* Your ${sub.serviceName} renewal is overdue!`;
  }

  return `*Moti Renew (Moti Technologies) - Renewal Alert* 🔔\n\n` +
    `Hello ${name},\n\n` +
    `${urgency}\n\n` +
    `📌 *Subscription Details:*\n` +
    `• Service: *${sub.serviceName}* (${sub.providerName || sub.category})\n` +
    `• Amount: *${formattedAmount}*\n` +
    `• Renewal Date: *${formattedDate}*\n` +
    `• Billing Cycle: *${sub.billingCycle}*\n` +
    `• Payment Method: *${sub.paymentMethod}*\n` +
    (sub.notes ? `• Notes: ${sub.notes}\n` : '') +
    `\nPlease ensure timely renewal to prevent service interruption.\n\n` +
    `_Powered by Moti Technologies - Never Miss a Renewal Again._`;
}

export function getWhatsAppShareUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
