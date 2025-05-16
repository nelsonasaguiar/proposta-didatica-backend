import { Request, Response } from 'express';
import { getValidAccessTokenByBrand, getValidAccessTokenByVehicle, updateBrandToken } from '../services/brand-token.service';
import smartcarClient from '../helper/smartcar.helper';
import { SmartCarToken } from '../models/smartcartoken.model';
import supabase from '../services/supabase.service';
import { getVehicleById, updateVehicleSmartCarIdByVin } from '../services/vehicle.service';

const smartcar = require('smartcar');

export const login = (_req: Request, res: Response): void => {
    const authUrl = smartcarClient.getAuthUrl(['read_vehicle_info', 'read_battery', 'read_charge', 'read_vin', 'read_alerts', 'read_charge_locations', 'read_diagnostics', 'read_location', 'read_odometer', 'read_security', 'control_charge', 'control_security']);
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

                const vehicleInfo = await getVehicleById(vehicleId)

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
        console.log('getting vehicles for brand: ', req.params.brand);
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
        const token = await getValidAccessTokenByVehicle(req.params.id);
        const vehicle = new smartcar.Vehicle(req.params.id, token);
        const battery = await vehicle.battery();
        res.json(battery);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle battery info', details: err });
    }
};

export const getVehicleInfo = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('req params id: ', req.params.id);
        const token = await getValidAccessTokenByVehicle(req.params.id);

        console.log('token: ', token);

        const vehicle = new smartcar.Vehicle(req.params.id, token);

        const info = await vehicle.attributes();
        res.json(info);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle info', details: err });
    }
};

export const getVehicleVin = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = await getValidAccessTokenByVehicle(req.params.id);
        const vehicle = new smartcar.Vehicle(req.params.id, token);
        const vin = await vehicle.vin();
        res.json(vin);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle VIN', details: err });
    }
};

export const getVehicleOdometer = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = await getValidAccessTokenByVehicle(req.params.id);
        const vehicle = new smartcar.Vehicle(req.params.id, token);
        const odometer = await vehicle.odometer();
        res.json(odometer);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle odometer', details: err });
    }
};

export const getVehicleLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = await getValidAccessTokenByVehicle(req.params.id);
        const vehicle = new smartcar.Vehicle(req.params.id, token);
        const location = await vehicle.location();
        res.json(location);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle location', details: err });
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
    getVehicleLocation
};