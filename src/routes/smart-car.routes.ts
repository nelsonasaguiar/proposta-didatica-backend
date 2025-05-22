import { Router } from 'express';
import smartCarController from '../controllers/smart-car.controller';

const router = Router();

// Smartcar authentication routes
router.get('/login', smartCarController.login);
router.get('/callback', smartCarController.callback);

// Vehicle routes
router.get('/vehicle/:id/battery', smartCarController.getVehicleBattery);
router.get('/vehicle/:id/info', smartCarController.getVehicleInfo);
router.get('/vehicle/:id/vin', smartCarController.getVehicleVin);
router.get('/vehicle/:brand/vehicles', smartCarController.getVehiclesForBrand);
router.get('/vehicle/:id/odometer', smartCarController.getVehicleOdometer);
router.get('/vehicle/:id/location', smartCarController.getVehicleLocation);


export default router;