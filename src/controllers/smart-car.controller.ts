import { Request, Response } from 'express';
import { getValidAccessTokenByBrand, getValidAccessTokenByVehicle, updateBrandToken } from '../services/brand-token.service';
import smartcarClient from '../helper/smartcar.helper';
import { SmartCarToken } from '../models/smartcartoken.model';
import supabase from '../services/supabase.service';
import { getVehicleById, updateVehicleSmartCarIdByVin, getVehicleBySmartCarId, getSmartCarIdByPlate } from '../services/vehicle.service';
import { isPlateNumberFormat } from '../utils/main-utils';

const smartcar = require('smartcar');

export const login = (_req: Request, res: Response): void => {
    const authUrl = smartcarClient.getAuthUrl(['read_vehicle_info', 'read_battery', 'read_charge', 'read_vin', 'read_alerts', 'read_charge_locations', 'read_diagnostics', 'read_location', 'read_odometer', 'read_security', 'control_charge', 'control_security', 'read_tires']);
    console.log('authUrl', authUrl);
    res.redirect(authUrl);
};

export const callback = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('callback called');
        console.log('req.query', req.query.code);


        const code = req.query.code as string;
        const token = (await smartcarClient.exchangeCode(code)) as SmartCarToken;
        const vehiclesRes = await smartcar.getVehicles(token.accessToken);
        const vehicleIds = vehiclesRes.vehicles.map((vehicle: string) => vehicle);
        vehicleIds.forEach(async (vehicleId: string) => {
            const smartCarVehicle = new smartcar.Vehicle(vehicleId, token.accessToken);
            const vinRes = await smartCarVehicle.vin();

            if (vinRes.vin) {
                await updateVehicleSmartCarIdByVin(vinRes.vin, vehicleId)
            }
        });

        console.log('<<<<<<<<<<-------->>>>>>>>>');
        if (vehicleIds.length > 0) {
            try {
                const vehicleId = vehicleIds[0]

                console.log('vehicle id: ', vehicleId);

                const vehicleInfo = await getVehicleBySmartCarId(vehicleId)

                console.log('vehicleInfo: ', vehicleInfo);

                const vehicleBrand = vehicleInfo.brand

                console.log('vehicle brand: ', vehicleBrand);

                const tokenToUpdate = {
                    accessToken: token.accessToken,
                    refreshToken: token.refreshToken,
                    expiration: token.expiration,
                    refreshExpiration: token.refreshExpiration
                }

                console.log('token to update: ', tokenToUpdate);

                if (vehicleBrand) {
                    await updateBrandToken(vehicleBrand, tokenToUpdate)
                }

                console.log('updated brand access token from callback success.');
            } catch (error) {
                console.log('failed to update brand access token from callback: ', error);
            }
        }
        console.log('<<<<<<<<<<-------->>>>>>>>>');

        res.json(token)
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to exchange code', details: err });
    }
};

export const getVehiclesForBrand = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = await getValidAccessTokenByBrand(req.params.brand);
        const vehicles = await smartcar.getVehicles(token);
        res.json(vehicles);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicles for brand', details: err });
    }
}

export const getVehicleBattery = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const battery = await vehicle.battery();
        res.json(battery);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle battery info', details: err });
    }
};

export const getVehicleCharge = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const charge = await vehicle.charge();
        res.json(charge);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle charge info', details: err });
    }
}

export const getVehicleInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const info = await vehicle.attributes();
        res.json(info);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle info', details: err });
    }
};

export const getVehicleVin = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);
        const vin = await vehicle.vin();
        res.json(vin);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle VIN', details: err });
    }
};

export const getVehicleOdometer = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const odometer = await vehicle.odometer();
        res.json(odometer);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle odometer', details: err });
    }
};

export const getVehicleLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const location = await vehicle.location();
        res.json(location);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle location', details: err });
    }
};

export const getVehicleBatteryCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const batteryCapacity = await vehicle.batteryCapacity();
        res.json(batteryCapacity);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle battery capacity', details: err });
    }
};

export const setVehicleChargeLimit = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const { limit } = req.body;

        if (typeof limit !== 'number' || limit < 0.5 || limit > 1) {
            res.status(400).json({ error: 'Invalid charge limit. Must be between 0.5 and 1' });
            return;
        }

        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const result = await vehicle.setChargeLimit(limit);
        res.json(result);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to set vehicle charge limit', details: err });
    }
};

export const controlVehicleCharge = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const { action } = req.body;

        if (!action || !['START', 'STOP'].includes(action.toUpperCase())) {
            res.status(400).json({ error: 'Invalid action. Must be START or STOP' });
            return;
        }

        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const result = action.toUpperCase() === 'START'
            ? await vehicle.startCharge()
            : await vehicle.stopCharge();

        res.json(result);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to control vehicle charge', details: err });
    }
};

export const getVehicleSystemStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const systemStatus = await vehicle.systemStatus();
        res.json(systemStatus);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle system status', details: err });
    }
};

export const getVehicleTirePressure = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const tirePressure = await vehicle.tirePressure();
        res.json(tirePressure);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle tire pressure', details: err });
    }
};

export const batchVehicleRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const { requests } = req.body;

        if (!Array.isArray(requests)) {
            res.status(400).json({ error: 'Invalid requests. Must be an array of paths' });
            return;
        }

        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const batchResponse = await vehicle.batch(requests);
        res.json(batchResponse);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to process batch requests', details: err });
    }
};

export default {
    login,
    callback,
    getVehicleBattery,
    getVehiclesForBrand,
    getVehicleInfo,
    getVehicleVin,
    getVehicleOdometer,
    getVehicleLocation,
    getVehicleCharge,
    getVehicleBatteryCapacity,
    setVehicleChargeLimit,
    controlVehicleCharge,
    getVehicleSystemStatus,
    getVehicleTirePressure,
    batchVehicleRequests
};