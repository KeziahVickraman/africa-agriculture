/**
 * Server-side client for Africa's Talking Sandbox SMS API
 * Endpoint: POST https://api.sandbox.africastalking.com/version1/messaging
 * Real sandbox SMS messages are viewable at: https://simulator.africastalking.com
 */

const AT_SANDBOX_URL = 'https://api.sandbox.africastalking.com/version1/messaging';
const SIMULATOR_URL = 'https://simulator.africastalking.com';

export interface SendSmsRequest {
  to: string;
  message: string;
}

export interface SendSmsResponse {
  success: boolean;
  recipient: string;
  messageId?: string;
  statusText: string;
  cost?: string;
  simulatorUrl: string;
  rawResponse?: any;
  error?: string;
}

export async function sendSandboxSms(req: SendSmsRequest): Promise<SendSmsResponse> {
  const apiKey = process.env.AT_SANDBOX_API_KEY?.trim();
  const username = process.env.AT_SANDBOX_USERNAME?.trim() || 'sandbox';

  // Normalize phone number (default Kenyan mobile format e.g. +2547XXXXXXXX)
  let cleanTo = req.to.replace(/\s+/g, '');
  if (cleanTo.startsWith('07') || cleanTo.startsWith('01')) {
    cleanTo = '+254' + cleanTo.substring(1);
  } else if (!cleanTo.startsWith('+')) {
    cleanTo = '+' + cleanTo;
  }

  // If API key is not configured, provide a clear simulator preview response
  if (!apiKey) {
    return {
      success: false,
      recipient: cleanTo,
      statusText: 'AT_SANDBOX_API_KEY not configured on server',
      simulatorUrl: SIMULATOR_URL,
      error: 'Africa\'s Talking API key missing in environment. Set AT_SANDBOX_API_KEY to test live sandbox dispatch.',
      rawResponse: {
        note: 'Live sandbox dispatch requires AT_SANDBOX_API_KEY. You can view dispatched SMS simulations directly at https://simulator.africastalking.com once configured.',
        simulatedMessage: req.message,
        intendedRecipient: cleanTo,
      },
    };
  }

  // Build urlencoded body
  const bodyParams = new URLSearchParams();
  bodyParams.append('username', username);
  bodyParams.append('to', cleanTo);
  bodyParams.append('message', req.message);

  const response = await fetch(AT_SANDBOX_URL, {
    method: 'POST',
    headers: {
      'apiKey': apiKey,
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const responseText = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(responseText);
  } catch {
    json = { rawText: responseText };
  }

  if (!response.ok) {
    return {
      success: false,
      recipient: cleanTo,
      statusText: `Failed (HTTP ${response.status})`,
      simulatorUrl: SIMULATOR_URL,
      error: `Africa's Talking Sandbox error: ${responseText}`,
      rawResponse: json,
    };
  }

  // AT response structure: { SMSMessageData: { Recipients: [{ number, status, cost, messageId }], Message: '...' } }
  const recipients = json?.SMSMessageData?.Recipients || [];
  const primaryRecipient = recipients[0] || {};
  const status = primaryRecipient.status || 'Sent';
  const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'sent';

  return {
    success: isSuccess,
    recipient: primaryRecipient.number || cleanTo,
    messageId: primaryRecipient.messageId,
    cost: primaryRecipient.cost,
    statusText: status,
    simulatorUrl: SIMULATOR_URL,
    rawResponse: json,
  };
}
