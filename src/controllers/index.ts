import { Request, Response } from 'express';

export const getHome = (req: Request, res: Response): void => {
    res.send('Welcome to the Express Backend Test!');
};

export const getAbout = (req: Request, res: Response): void => {
    res.send('This is the about page.');
};

export default {
    getHome,
    getAbout
};