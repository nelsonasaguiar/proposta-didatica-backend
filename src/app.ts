import express, { Application } from 'express';
import router from './routes/email.routes';
import cors from 'cors';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Add health check endpoint
app.get('/test', (req, res) => {
    res.status(200).send('OK!!!');
});

// Use the router as middleware
app.use('/api', router);

const PORT: number = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}..`);
});