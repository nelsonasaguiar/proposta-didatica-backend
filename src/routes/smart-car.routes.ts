import { Router } from 'express';
import smartCarController from '../controllers/smart-car.controller';

const router = Router();

// Smartcar authentication routes
router.get('/login', smartCarController.login);
router.get('/callback', smartCarController.callback);
router.post('/refresh-token', smartCarController.refreshToken);

// Vehicle routes
router.get('/vehicle/:id', smartCarController.getVehicleBattery);
router.get('/vehicle/:id/info', smartCarController.getVehicleInfo);
router.get('/vehicle/:id/vin', smartCarController.getVehicleVin);
router.get('/vehicle/:brand/vehicles', smartCarController.getVehiclesForBrand);


export default router;