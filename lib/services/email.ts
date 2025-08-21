import nodemailer from 'nodemailer'
import QRCode from 'qrcode'

interface ClaimConfirmationEmailParams {
  to: string
  receiverName: string
  listing: {
    title: string
    quantity: number
    unit: string
    availableUntil: Date
    location: string
    donorName: string
    donorEmail?: string
  }
  qrCode: string
  claimDate: Date
  expiresAt: Date
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendClaimConfirmationEmail(params: ClaimConfirmationEmailParams) {
  const { to, receiverName, listing, qrCode, claimDate, expiresAt } = params

  try {
    // Generate QR code as data URL (base64 image)
    const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #2ECC71, #3498DB); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .qr-code { text-align: center; margin: 20px 0; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .detail-item { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #FFF3CD; border: 1px solid #FFEEBA; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍎 Food Claim Confirmation</h1>
          <p>Your food reservation has been successfully confirmed!</p>
        </div>
        
        <div class="content">
          <p>Dear ${receiverName},</p>
          <p>Thank you for claiming the food donation. Here are your claim details:</p>
          
          <div class="details">
            <h3>Food Details</h3>
            <div class="detail-item"><strong>Item:</strong> ${listing.title}</div>
            <div class="detail-item"><strong>Quantity:</strong> ${listing.quantity} ${listing.unit}</div>
            <div class="detail-item"><strong>Pickup Before:</strong> ${new Date(listing.availableUntil).toLocaleString()}</div>
            <div class="detail-item"><strong>Location:</strong> ${listing.location}</div>
            <div class="detail-item"><strong>Donor:</strong> ${listing.donorName} ${listing.donorEmail ? `(${listing.donorEmail})` : ''}</div>
          </div>

          <div class="qr-code">
            <h3>Your Pickup QR Code</h3>
            <p>Show this QR code to the donor when picking up the food:</p>
            <div style="background: white; padding: 15px; display: inline-block; border-radius: 8px;">
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 150px; height: 150px;" />
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              <strong>QR Code:</strong> ${qrCode}<br>
              <em>Expires: ${new Date(expiresAt).toLocaleString()}</em>
            </p>
          </div>

          <div class="warning">
            <h4>⚠️ Important Information</h4>
            <p>Please arrive on time and bring your own containers if possible.</p>
          </div>

          <div class="details">
            <h3>Pickup Instructions</h3>
            <ul>
              <li>Show the QR code to the donor upon arrival</li>
              <li>Bring your own containers if possible</li>
              <li>Arrive during the specified pickup window</li>
              <li>Be respectful of the donor's time and property</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This is an automated message from Smart Surplus Food Rescue System.</p>
          <p>If you have any questions, please contact the donor directly.</p>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: `"Smart Surplus" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Food Claim Confirmation: ${listing.title}`,
      html: htmlContent,
    })

    console.log(`Claim confirmation email with QR code sent to ${to}`)
  } catch (error) {
    console.error('Error sending claim confirmation email:', error)
    // Fallback: send email without QR code image if generation fails
    await sendTextOnlyEmail(params)
  }
}

// Fallback function if QR code generation fails
async function sendTextOnlyEmail(params: ClaimConfirmationEmailParams) {
  const { to, receiverName, listing, qrCode, expiresAt } = params
  
  const textContent = `
Food Claim Confirmation

Dear ${receiverName},

Thank you for claiming the food donation. Here are your claim details:

Food Details:
- Item: ${listing.title}
- Quantity: ${listing.quantity} ${listing.unit}
- Pickup Before: ${new Date(listing.availableUntil).toLocaleString()}
- Location: ${listing.location}
- Donor: ${listing.donorName} ${listing.donorEmail ? `(${listing.donorEmail})` : ''}

Your Pickup QR Code:
Show this code to the donor when picking up the food:
${qrCode}

QR Code Expires: ${new Date(expiresAt).toLocaleString()}

Pickup Instructions:
• Show the QR code to the donor upon arrival
• Bring your own containers if possible
• Arrive during the specified pickup window
• Be respectful of the donor's time and property

This is an automated message from Smart Surplus Food Rescue System.
`

  try {
    await transporter.sendMail({
      from: `"Smart Surplus" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Food Claim Confirmation: ${listing.title}`,
      text: textContent,
    })
    console.log(`Text-only confirmation email sent to ${to}`)
  } catch (error) {
    console.error('Error sending text-only email:', error)
  }
}