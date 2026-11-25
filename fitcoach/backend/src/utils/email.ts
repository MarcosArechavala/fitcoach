import { env } from '../config/env.js'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function wrapEmailLayout(title: string, bodyHtml: string): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
    <body style="margin:0;padding:0;background-color:#0b0d10;font-family:Arial,Helvetica,sans-serif;color:#f4f4f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#14171c;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:24px 28px;border-bottom:1px solid #27272a;">
                  <span style="font-size:18px;font-weight:800;letter-spacing:1.5px;color:#b8f34b;">FITCOACH</span>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff;">${title}</h1>
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px;border-top:1px solid #27272a;font-size:12px;color:#71717a;">
                  Este es un mensaje automático de FITCOACH. Si no esperabas este correo, podés ignorarlo.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.info(`[Email][Simulado - falta RESEND_API_KEY] Para: ${to} | Asunto: ${subject}`)
    return false
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error(`[Email] Error Resend (${response.status}):`, errorBody)
      return false
    }

    return true
  } catch (err) {
    console.error('[Email] Error de red al enviar correo:', err)
    return false
  }
}

export async function sendInvitationEmail(
  to: string,
  firstName: string,
  invitationUrl: string,
) {
  const safeName = escapeHtml(firstName)
  const html = wrapEmailLayout(
    `¡Bienvenido a FITCOACH, ${safeName}!`,
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#d4d4d8;">
      Tu entrenador te dio de alta en <strong>FITCOACH</strong> para que accedas a tus rutinas, registres tus entrenamientos y sigas tu progreso.
    </p>
    <p style="margin:0 0 24px;line-height:1.6;color:#d4d4d8;">
      Hacé clic en el botón de abajo para crear tu contraseña y activar tu cuenta (el enlace vence en 72 horas):
    </p>
    <a href="${invitationUrl}" style="display:inline-block;padding:12px 24px;background-color:#b8f34b;color:#0b0d10;text-decoration:none;font-weight:700;border-radius:8px;">
      Activar mi cuenta
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#71717a;word-break:break-all;">
      Si el botón no funciona, copiá y pegá este enlace:<br/>${invitationUrl}
    </p>
    `,
  )

  return sendEmail({
    to,
    subject: 'Tu invitación a FITCOACH — Activá tu cuenta',
    html,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = wrapEmailLayout(
    'Restablecer tu contraseña',
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#d4d4d8;">
      Recibimos una solicitud para cambiar la contraseña de tu cuenta en <strong>FITCOACH</strong>.
    </p>
    <p style="margin:0 0 24px;line-height:1.6;color:#d4d4d8;">
      Hacé clic en el siguiente botón para elegir una nueva contraseña (válido por 1 hora):
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#b8f34b;color:#0b0d10;text-decoration:none;font-weight:700;border-radius:8px;">
      Restablecer contraseña
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#71717a;word-break:break-all;">
      Si el botón no funciona, copiá y pegá este enlace:<br/>${resetUrl}
    </p>
    `,
  )

  return sendEmail({
    to,
    subject: 'Recuperación de contraseña — FITCOACH',
    html,
  })
}

export async function sendNewLeadEmail(
  to: string,
  lead: {
    name: string
    email: string
    whatsapp: string
    goal: string
    message: string
  },
) {
  const digits = lead.whatsapp.replace(/\D/g, '')
  const waUrl = `https://wa.me/${digits}`

  const html = wrapEmailLayout(
    'Nueva consulta desde la web',
    `
    <p style="margin:0 0 16px;line-height:1.6;color:#d4d4d8;">
      ¡Tenés un nuevo interesado en entrenar con vos!
    </p>
    <table width="100%" cellpadding="8" cellspacing="0" style="background-color:#0b0d10;border-radius:8px;margin-bottom:20px;font-size:14px;">
      <tr><td style="color:#a1a1aa;width:110px;"><strong>Nombre:</strong></td><td style="color:#ffffff;">${escapeHtml(lead.name)}</td></tr>
      <tr><td style="color:#a1a1aa;"><strong>Email:</strong></td><td style="color:#ffffff;">${escapeHtml(lead.email)}</td></tr>
      <tr><td style="color:#a1a1aa;"><strong>WhatsApp:</strong></td><td style="color:#ffffff;">${escapeHtml(lead.whatsapp)}</td></tr>
      <tr><td style="color:#a1a1aa;"><strong>Objetivo:</strong></td><td style="color:#ffffff;">${escapeHtml(lead.goal)}</td></tr>
      <tr><td style="color:#a1a1aa;vertical-align:top;"><strong>Mensaje:</strong></td><td style="color:#ffffff;">${escapeHtml(lead.message)}</td></tr>
    </table>
    <a href="${waUrl}" style="display:inline-block;padding:12px 24px;background-color:#b8f34b;color:#0b0d10;text-decoration:none;font-weight:700;border-radius:8px;">
      Responder por WhatsApp
    </a>
    `,
  )

  return sendEmail({
    to,
    subject: `Nueva consulta de ${lead.name} — FITCOACH`,
    html,
  })
}
