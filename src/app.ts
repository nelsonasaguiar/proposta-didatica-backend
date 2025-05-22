import express, { Application } from 'express';
import cors from 'cors';
import smartCarRoutes from './routes/smart-car.routes';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Add health check endpoint
app.get('/test', (req, res) => {
    res.status(200).send('OK!!!');
});

// Use the router as middleware
app.use('/api', smartCarRoutes);

const PORT: number = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}..`);
});