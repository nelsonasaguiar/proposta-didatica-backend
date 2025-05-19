import nodemailer from "nodemailer";
import { Request, RequestHandler, Response } from "express";
import multer from "multer";

// Configure CORS headers
const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Configure email senders
interface EmailSender {
   email: string;
   host: string;
   port: number;
   secure: boolean;
   auth: {
      user: string;
      pass: string;
   }
}

const emailSenders: Record<string, EmailSender> = {
   'default': {
      email: 'geral@rentalcarspro.com',
      host: 'mail.rentalcarspro.com',
      port: 465,
      secure: true,
      auth: {
         user: 'geral@rentalcarspro.com',
         pass: process.env.EMAIL_PASSWORD || '@.OzCojgd{zu' // Should be in environment variables
      }
   },
   'support': {
      email: 'support@propostadidatica.pt',
      host: process.env.SUPPORT_EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SUPPORT_EMAIL_PORT || '587'),
      secure: process.env.SUPPORT_EMAIL_SECURE === 'true',
      auth: {
         user: process.env.SUPPORT_EMAIL || 'support@propostadidatica.pt',
         pass: process.env.SUPPORT_EMAIL_PASSWORD || ''
      }
   }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
   storage,
   limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
   }
});

/**
 * Create a transporter for the specified sender
 */
function getTransporter(senderType: string = 'default') {
   const sender = emailSenders[senderType] || emailSenders.default;
   return nodemailer.createTransport({
      host: sender.host,
      port: sender.port,
      secure: sender.secure,
      auth: sender.auth
   });
}

/**
 * Log email activity to database
 */
async function logEmailSent(to: string, subject: string, from: string) {
   try {
      console.log(`Email from ${from} to: ${to} with subject: ${subject} was sent.`)
      // const { error } = await supabase
      //    .from('email_logs')
      //    .insert({
      //       to,
      //       subject,
      //       from,
      //       sent_at: new Date().toISOString()
      //    });

      // if (error) {
      //    console.error('Failed to log email activity:', error);
      // }
   } catch (err) {
      console.error('Error logging email:', err);
   }
}

/**
 * Controller to handle email sending request with attachment
 */
export const sendEmailWithAttachment: RequestHandler[] = [
   upload.single('file'),
   async (req: Request, res: Response): Promise<void> => {
      try {
         const { to, subject, html, senderType = 'default' } = req.body;
         const file = req.file;

         if (!to || !subject || !html || !file) {
            res.status(400).json({
               error: 'Missing required fields. Please provide to, subject, html, and a file attachment.'
            });
            return;
         }

         const transport = getTransporter(senderType);
         const sender = emailSenders[senderType] || emailSenders.default;

         if (!transport || !sender) {
            res.status(400).json({ error: 'Invalid sender type' });
            return;
         }

         const info = await transport.sendMail({
            from: `"Proposta Didática" <${sender.email}>`,
            to,
            subject,
            html,
            attachments: [{
               filename: file.originalname,
               content: file.buffer
            }]
         });

         await logEmailSent(to, subject, sender.email);

         res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
      } catch (error: any) {
         console.error('Error sending email:', error);
         res.status(500).json({ error: error.message || 'Failed to send email' });
      }
   }
];


/**
 * Function to send email programmatically (without HTTP request)
 */
// export async function sendEmail({
//    to,
//    subject,
//    html,
//    attachments = [],
//    senderType = 'default'
// }: {
//    to: string | string[];
//    subject: string;
//    html: string;
//    attachments?: Array<{
//       filename: string;
//       content?: Buffer | Uint8Array | string;
//       path?: string;
//    }>;
//    senderType?: string;
// }) {
//    // Get the appropriate transporter
//    const transport = getTransporter(senderType);
//    const sender = emailSenders[senderType] || emailSenders.default;

//    try {
//       const result = await transport.sendMail({
//          from: `"Proposta Didática" <${sender.email}>`,
//          to: Array.isArray(to) ? to.join(',') : to,
//          subject,
//          html,
//          attachments
//       });

//       // Log the email
//       await logEmailSent(
//          Array.isArray(to) ? to.join(',') : to,
//          subject,
//          sender.email
//       );

//       return { success: true, messageId: result.messageId };
//    } catch (error) {
//       console.error('Failed to send email:', error);
//       throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
//    }
// }