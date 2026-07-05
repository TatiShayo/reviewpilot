import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

interface DigestData {
  newReviews: number
  respondedReviews: number
  avgRating: number
  responseRate: number
  weekLabel: string
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

  try {
    await getResend().emails.send({
      from: 'ReviewPilot Digest <digest@reviewpilot.app>',
      to,
      subject: `Weekly Review Digest — ${data.weekLabel}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">ReviewPilot Weekly Digest</h1>
          <p>Hi ${name}, here&apos;s your review summary for ${data.weekLabel}:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>New Reviews</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${data.newReviews}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Reviews Responded</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${data.respondedReviews}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Response Rate</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${data.responseRate}%</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Average Rating</strong></td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">${data.avgRating.toFixed(1)} ★</td>
            </tr>
          </table>

          <p style="margin-top: 24px;">
            <a href="https://reviewpilot.app/dashboard" style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Dashboard
            </a>
          </p>

          <p style="margin-top: 32px; font-size: 12px; color: #9ca3af;">
            You&apos;re receiving this because you have a ReviewPilot account.
            <br />
            To unsubscribe from digest emails, update your <a href="https://reviewpilot.app/dashboard/settings">notification settings</a>.
          </p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('[Digest] Failed to send:', error)
    return { success: false, reason: 'Send failed' }
  }
}
