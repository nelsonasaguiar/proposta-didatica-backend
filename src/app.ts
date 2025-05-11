import express, { Application } from 'express';
import router from './routes/index'; // Import the router directly

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the router as middleware
app.use('/', router);

const PORT: number = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});