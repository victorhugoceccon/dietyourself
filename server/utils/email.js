import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// Configurar transporter de email
const createTransporter = () => {
  // Se houver configuração SMTP no .env, usar
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Caso contrário, usar conta de teste (apenas para desenvolvimento)
  // Em produção, configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass',
    },
  })
}

export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const transporter = createTransporter()
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = resetUrl || `${frontendUrl}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@lifefit.com',
      to: email,
      subject: 'Recuperação de Senha - LifeFit',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              color: #4CAF50;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #4CAF50;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 500;
            }
            .button:hover {
              background: #45a049;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">LifeFit</div>
              <p style="color: #666; margin: 0;">Seu corpo, no seu ritmo</p>
            </div>
            
            <h2 style="color: #333; margin-top: 0;">Recuperação de Senha</h2>
            
            <p>Olá,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta LifeFit.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </div>
            
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #4CAF50;">${resetLink}</p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta recuperação de senha, ignore este email.
            </div>
            
            <div class="footer">
              <p>Este é um email automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} LifeFit. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Recuperação de Senha - LifeFit
        
        Olá,
        
        Recebemos uma solicitação para redefinir a senha da sua conta LifeFit.
        
        Acesse o link abaixo para criar uma nova senha:
        ${resetLink}
        
        Este link expira em 1 hora. Se você não solicitou esta recuperação de senha, ignore este email.
        
        Este é um email automático, por favor não responda.
        
        © ${new Date().getFullYear()} LifeFit. Todos os direitos reservados.
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email de recuperação enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error)
    throw new Error('Erro ao enviar email de recuperação')
  }
}



