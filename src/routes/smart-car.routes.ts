import { Router } from 'express';
const smartcar = require('smartcar');

const smartcarClient = new smartcar.AuthClient({
   clientId: "dc0f0278-80d5-42c2-aa43-d0dc0bab588b",
   clientSecret: "47af6451-4e18-4ff2-920d-771123499182",
   redirectUri: 'https://35.188.168.110.nip.io/proposta-didatica/smartcar/callback'
});

const router = Router();

router.get('/smartcar/login', (_req, res) => {
   const authUrl = smartcarClient.getAuthUrl(['read_vehicle_info', 'read_battery', 'read_charge', 'read_vin', 'read_alerts']);
   console.log('authUrl', authUrl);
   res.redirect(authUrl);
});

router.get('/smartcar/callback', async (req, res) => {
   const code = req.query.code;
   const token = await smartcarClient.exchangeCode(code);
   res.json(token);
});

router.get('/smartcar/vehicles', async (req, res) => {
   try {
      const token = req.headers.authorization?.split(' ')[1]; // Get token from Bearer header
      console.log('token', token);
      const vehicles = await smartcar.getVehicles(token);
      res.json(vehicles);
   } catch (err) {
      console.log('err', err);
      res.status(500).json({ error: 'Failed to get vehicles', details: err });
   }
});

router.get('/smartcar/vehicle/:id', async (req, res) => {
   try {
      const token = req.headers.authorization?.split(' ')[1]; // Get token from Bearer header
      console.log('token: ', token);
      console.log('req.params.id: ', req.params.id);
      const vehicle = new smartcar.Vehicle(req.params.id, token);
      const battery = await vehicle.battery();
      res.json(battery);
   } catch (err) {
      console.log('err', err);
      res.status(500).json({ error: 'Failed to get vehicle battery info', details: err });
   }
});

router.get('/smartcar/vehicle/:id/info', async (req, res) => {
   try {
      const token = req.headers.authorization?.split(' ')[1];
      const vehicle = new smartcar.Vehicle(req.params.id, token);
      const info = await vehicle.attributes();
      res.json(info);
   } catch (err) {
      console.log('err', err);
      res.status(500).json({ error: 'Failed to get vehicle info', details: err });
   }
});


router.post('/smartcar/refresh-token', async (req, res) => {
   try {
      const { refreshToken } = req.body;
      const tokens = await smartcarClient.exchangeRefreshToken(refreshToken);
      res.json(tokens);
   } catch (err) {
      res.status(500).json({ error: 'Failed to refresh token', details: err });
   }
});

router.get('/smartcar/vehicle/:id/vin', async (req, res) => {
   try {
      const token = req.headers.authorization?.split(' ')[1];
      const vehicle = new smartcar.Vehicle(req.params.id, token);
      const vin = await vehicle.vin();
      res.json(vin);
   } catch (err) {
      console.log('err', err);
      res.status(500).json({ error: 'Failed to get vehicle VIN', details: err });
   }
});


export default router;