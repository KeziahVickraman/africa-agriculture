import { SmsProvider } from '../providers/types.ts';
import { SmsSendResult } from '../../types/farm.ts';

export class AfricasTalkingSandboxProvider implements SmsProvider {
  id = 'africas_talking_sandbox';
  name = "Africa's Talking Sandbox";
  description = 'Sends SMS simulated to Africa\'s Talking Sandbox web simulator (simulator.africastalking.com)';

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const response = await fetch('/api/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr: any;
      try {
        parsedErr = JSON.parse(errText);
      } catch {
        parsedErr = { error: errText };
      }
      return {
        success: false,
        recipient: to,
        statusText: `Failed (HTTP ${response.status})`,
        simulatorUrl: 'https://simulator.africastalking.com',
        error: parsedErr.error || `HTTP ${response.status}: ${response.statusText}`,
        rawResponse: parsedErr,
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      recipient: data.recipient || to,
      messageId: data.messageId,
      cost: data.cost,
      statusText: data.statusText || (data.success ? 'Sent to Simulator' : 'Failed'),
      simulatorUrl: data.simulatorUrl || 'https://simulator.africastalking.com',
      rawResponse: data.rawResponse,
      error: data.error,
    };
  }
}

export const smsProviderInstance = new AfricasTalkingSandboxProvider();
