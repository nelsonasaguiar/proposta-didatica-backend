import { Router } from 'express';
import * as controller from '../controllers/index';

const router = Router();

// Define routes
router.get('/', controller.getHome);
router.get('/about', controller.getAbout);

export default router;