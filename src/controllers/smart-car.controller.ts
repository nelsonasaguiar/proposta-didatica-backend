import { Request, Response } from 'express';
import { getValidAccessTokenByBrand, getValidAccessTokenByVehicle, updateBrandToken } from '../services/brand-token.service';
import smartcarClient from '../helper/smartcar.helper';
import { SmartCarToken } from '../models/smartcartoken.model';
import supabase from '../services/supabase.service';
import { getVehicleById, updateVehicleSmartCarIdByVin, getVehicleBySmartCarId, getSmartCarIdByPlate } from '../services/vehicle.service';
import { isPlateNumberFormat } from '../utils/main-utils';
import { updateVehicleData } from '../services/vehicle-data.service';
import { getAddressFromCoordinates } from '../utils/geocoding';

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

async function shouldUpdateData(vehicleId: string, featureName: string): Promise<{ boolean: boolean, minutesRemaining: number }> {
    const { data, error } = await supabase
        .from('vehicles')
        .select('latest_car_data')
        .eq('id', vehicleId)
        .single();

    if (error) return { boolean: true, minutesRemaining: 0 }; // If error, assume we need to update

    const latestData = data?.latest_car_data?.[featureName];
    if (!latestData?.fetched_at) return { boolean: true, minutesRemaining: 0 };

    const lastFetched = new Date(latestData.fetched_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const minutesRemaining = Math.ceil((lastFetched.getTime() + 30 * 60 * 1000 - Date.now()) / 60000);

    return { boolean: lastFetched < thirtyMinutesAgo, minutesRemaining };
}

export const getVehicleBattery = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;

        if (!actualSmartCarId) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const vehicle = await getVehicleBySmartCarId(actualSmartCarId);
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const shouldUpdate = await shouldUpdateData(vehicle.id, 'battery');
        if (!shouldUpdate.boolean) {
            res.json({ warning: 'Please wait before requesting battery data again', minutesRemaining: shouldUpdate.minutesRemaining });
            return;
        }

        const smartCarVehicle = new smartcar.Vehicle(actualSmartCarId, token);
        const battery = await smartCarVehicle.battery();

        await updateVehicleData(
            vehicle.id,
            'battery',
            {
                percentRemaining: battery.percentRemaining,
                range: battery.range
            },
            battery.meta.fetchedAt,
            battery.meta.dataAge
        );

        res.json(battery);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle battery info', details: err });
    }
};

export const getVehicleOdometer = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        if (!actualSmartCarId) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        const vehicle = await getVehicleBySmartCarId(actualSmartCarId);
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const shouldUpdate = await shouldUpdateData(vehicle.id, 'odometer');
        if (!shouldUpdate.boolean) {
            res.json({ warning: 'Please wait before requesting odometer data again', minutesRemaining: shouldUpdate.minutesRemaining });
            return;
        }

        const smartCarVehicle = new smartcar.Vehicle(actualSmartCarId, token);
        const odometer = await smartCarVehicle.odometer();

        await updateVehicleData(
            vehicle.id,
            'odometer',
            {
                distance: odometer.distance,
                unitSystem: odometer.meta.unitSystem
            },
            odometer.meta.fetchedAt,
            odometer.meta.dataAge
        );

        res.json(odometer);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle odometer', details: err });
    }
};

export const getVehicleLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id;
        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        if (!actualSmartCarId) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }
        const vehicle = await getVehicleBySmartCarId(actualSmartCarId);
        if (!vehicle) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const shouldUpdate = await shouldUpdateData(vehicle.id, 'location');
        if (!shouldUpdate.boolean) {
            res.json({ warning: 'Please wait before requesting location data again', minutesRemaining: shouldUpdate.minutesRemaining });
            return;
        }

        const smartCarVehicle = new smartcar.Vehicle(actualSmartCarId, token);
        const location = await smartCarVehicle.location();
        const address = await getAddressFromCoordinates(location.latitude, location.longitude);

        console.log('location: ', location);

        await updateVehicleData(
            vehicle.id,
            'location',
            {
                latitude: location.latitude,
                longitude: location.longitude,
                address: address
            },
            location.meta.fetchedAt,
            location.meta.dataAge
        );

        res.json(location);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle location', details: err });
    }
};

export const getVehicleCharge = async (req: Request, res: Response): Promise<void> => {
    try {
        const submittedId = req.params.id
        const token = await getValidAccessTokenByVehicle(submittedId);

        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId

        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        const charge = await vehicle.charge();

        await updateVehicleData(
            vehicle.id,
            'charge',
            {
                isPluggedIn: charge.isPluggedIn,
                state: charge.state
            },
            charge.meta.fetchedAt,
            charge.meta.dataAge
        );

        res.json(charge);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ error: 'Failed to get vehicle charge info', details: err });
    }
}

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

        const result = await vehicle.diagnosticSystemStatus();
        res.json(result);
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
            res.status(400).json({
                error: 'Invalid request format',
                message: 'Please send requests as a JSON array: { "requests": ["/odometer", "/location"] }'
            });
            return;
        }

        const token = await getValidAccessTokenByVehicle(submittedId);
        const actualSmartCarId = isPlateNumberFormat(submittedId) ? await getSmartCarIdByPlate(submittedId) : submittedId;
        const vehicle = new smartcar.Vehicle(actualSmartCarId, token);

        console.log('Making batch request with paths:', requests);
        const batchResponse = await vehicle.batch(requests);
        console.log('Smartcar batch response:', batchResponse);

        // Call each function to get the actual data
        const results = await Promise.all(
            requests.map(async (path) => {
                const key = path.replace('/', '');
                const data = await batchResponse[key]();
                return {
                    path,
                    data
                };
            })
        );

        res.json({ responses: results });
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