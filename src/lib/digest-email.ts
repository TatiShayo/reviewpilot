import { Resend } from 'resend'
import { generateUnsubscribeUrl } from './unsubscribe'

let resendClient: Resend | null = null

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export interface DigestData {
  newReviews: number
  respondedReviews: number
  avgRating: number
  responseRate: number
  weekLabel: string
  tenantId?: string
  unsubscribeUrl?: string
}

export async function sendDigestEmail(
  to: string,
  name: string,
  data: DigestData
) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[Digest] Skipping — RESEND_API_KEY not configured')
    return { success: false, reason: 'No API key' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reviewpilot.app'
  const unsubUrl =
    data.unsubscribeUrl ||
    (data.tenantId ? generateUnsubscribeUrl(appUrl, to, data.tenantId, 'digest') : `${appUrl}/dashboard/settings`)

  try {
    await getResend().emails.send({
      from: 'ReviewPilot Digest <digest@reviewpilot.app>',
      to,
      subject: `Weekly Review Digest — ${data.weekLabel}`,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #18181b;">
          <h1 style="color: #f97316; font-size: 24px; margin-bottom: 8px;">ReviewPilot Weekly Digest</h1>
          <p style="font-size: 15px; color: #52525b; margin-bottom: 24px;">Hi ${name}, here&apos;s your review summary for <strong>${data.weekLabel}</strong>:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
            <tr style="background: #f4f4f5;">
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; font-size: 14px; font-weight: 600;">New Reviews</td>
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; text-align: right; font-size: 14px; font-weight: bold; color: #18181b;">${data.newReviews}</td>
            </tr>
            <tr>
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; font-size: 14px; font-weight: 600;">Reviews Responded</td>
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; text-align: right; font-size: 14px; font-weight: bold; color: #18181b;">${data.respondedReviews}</td>
            </tr>
            <tr style="background: #f4f4f5;">
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; font-size: 14px; font-weight: 600;">Response Rate</td>
              <td style="padding: 14px; border-bottom: 1px solid #e4e4e7; text-align: right; font-size: 14px; font-weight: bold; color: #16a34a;">${data.responseRate}%</td>
            </tr>
            <tr>
              <td style="padding: 14px; font-size: 14px; font-weight: 600;">Average Rating</td>
              <td style="padding: 14px; text-align: right; font-size: 14px; font-weight: bold; color: #eab308;">${data.avgRating.toFixed(1)} ★</td>
            </tr>
          </table>

          <div style="margin-top: 32px; text-align: center;">
            <a href="${appUrl}/dashboard" style="display: inline-block; background: #f97316; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Open ReviewPilot Dashboard
            </a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; line-height: 1.5;">
            You are receiving this digest because you have an active ReviewPilot account.
            <br />
            <a href="${unsubUrl}" style="color: #71717a; text-decoration: underline;">
              Unsubscribe from digest emails
            </a>
            &nbsp;·&nbsp;
            <a href="${appUrl}/dashboard/settings" style="color: #71717a; text-decoration: underline;">
              Notification Preferences
            </a>
          </div>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('[Digest] Failed to send:', error)
    return { success: false, reason: 'Send failed' }
  }
}
