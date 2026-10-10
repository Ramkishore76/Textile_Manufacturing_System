import dotenv from 'dotenv';
dotenv.config();

export interface OtpRecord {
  code: string;
  expiresAt: number;
  lastSentAt: number;
  attempts: number;
  type: 'LOGIN_2FA' | 'NEW_USER_VERIFICATION';
  userData?: {
    name: string;
    role: string;
    passwordHash: string;
    phone?: string;
    companyName?: string;
  };
}

// In-memory verification storage keyed by lowercase email address
const otpStore = new Map<string, OtpRecord>();

// Clean up expired OTPs periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

export class EmailService {
  private static apiKey = process.env.BREVO_API_KEY || '';
  private static senderEmail = process.env.BREVO_SENDER_EMAIL || 'ramkishoresm@gmail.com';
  private static senderName = process.env.BREVO_SENDER_NAME || 'Everest Textile Mills';

  /**
   * Generate a random 6-digit numeric OTP code
   */
  public static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send Transactional Email with 6-digit verification code using Brevo API
   */
  public static async sendOtpEmail(
    toEmail: string,
    toName: string,
    otpCode: string,
    purpose: 'LOGIN_2FA' | 'NEW_USER_VERIFICATION' = 'LOGIN_2FA'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const isRegistration = purpose === 'NEW_USER_VERIFICATION';
    const subject = isRegistration
      ? `Welcome to Everest Textile Mills — Verify Your Account (${otpCode})`
      : `Everest Textile Mills — One-Time Verification Code: ${otpCode}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; margin: 0; padding: 30px; color: #18181b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header p { margin: 6px 0 0; font-size: 12px; opacity: 0.9; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 15px; font-weight: 600; color: #09090b; margin-bottom: 8px; }
          .message { font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 6px; }
          .otp-code { font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 32px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; }
          .expiry-note { font-size: 11px; color: #71717a; text-align: center; margin-top: 12px; }
          .security-footer { border-top: 1px solid #f4f4f5; margin-top: 28px; padding-top: 20px; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Everest Textile Mills</h1>
            <p>Manufacturing Vault & Task Governance Platform</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${toName || 'User'},</div>
            <div class="message">
              ${
                isRegistration
                  ? 'Thank you for registering your profile with Everest Textile Mills. Please verify your email address to activate your factory access portal.'
                  : 'A session authentication request was initiated for your Everest Textile Mills account. Use the one-time verification code below to authorize your login:'
              }
            </div>

            <div class="otp-box">
              <div class="otp-label">Security Verification Code</div>
              <div class="otp-code">${otpCode}</div>
            </div>

            <div class="expiry-note">
              ⏱️ This verification code is valid for <strong>10 minutes</strong>.
            </div>

            <div class="security-footer">
              <strong>Security Notice:</strong> Everest Textile Mills employees will never ask for your verification code. If you did not request this code, please disregard this email or report unauthorized activity to the IT department.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      console.log(`[Brevo] Sending ${purpose} OTP email to ${toEmail}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: this.senderName,
            email: this.senderEmail,
          },
          to: [
            {
              email: toEmail,
              name: toName || toEmail,
            },
          ],
          subject,
          htmlContent,
        }),
      });

      const data = await response.json() as any;

      if (response.ok && data.messageId) {
        console.log(`[Brevo] Email delivered successfully! Message ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.warn(`[Brevo] Brevo API returned response:`, data);
        return {
          success: false,
          error: data.message || 'Brevo API error',
        };
      }
    } catch (err: any) {
      console.error(`[Brevo] Error dispatching email:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Save an OTP in memory with 10-minute expiry and rate limit tracking
   */
  public static setOtp(
    email: string,
    code: string,
    type: 'LOGIN_2FA' | 'NEW_USER_VERIFICATION',
    userData?: OtpRecord['userData']
  ): void {
    const key = email.toLowerCase().trim();
    otpStore.set(key, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      lastSentAt: Date.now(),
      attempts: 0,
      type,
      userData,
    });
  }

  /**
   * Get an existing OTP record
   */
  public static getOtp(email: string): OtpRecord | undefined {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);
    if (!record) return undefined;

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return undefined;
    }

    return record;
  }

  /**
   * Check if a resend is allowed (enforce 60-second cooldown)
   */
  public static canResend(email: string): { allowed: boolean; waitSeconds?: number } {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);
    if (!record) return { allowed: true };

    const elapsed = Date.now() - record.lastSentAt;
    if (elapsed < 60 * 1000) {
      return {
        allowed: false,
        waitSeconds: Math.ceil((60 * 1000 - elapsed) / 1000),
      };
    }

    return { allowed: true };
  }

  /**
   * Validate user-supplied OTP code
   */
  public static verifyOtp(
    email: string,
    submittedCode: string
  ): { valid: boolean; error?: string; record?: OtpRecord } {
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) {
      return { valid: false, error: 'Verification code expired or not found. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      otpStore.delete(key);
      return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
    }

    if (record.code !== submittedCode.trim()) {
      return { valid: false, error: 'Incorrect verification code. Please check and try again.' };
    }

    // Success - consume and delete OTP
    otpStore.delete(key);
    return { valid: true, record };
  }
}
