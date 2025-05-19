import { Router } from 'express';
import { sendEmailWithAttachment } from '../services/email.service';

const router = Router();

// Route to handle email with attachment
router.post('/send', sendEmailWithAttachment);

export default router;