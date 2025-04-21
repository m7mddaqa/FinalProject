import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import User from './Schemas/User.js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';


import requireAuth from './middlewares/requireAuth.js';
import signupRouter from './Routers/signupRouter.js';
import loginRouter from './Routers/loginRouter.js';
import testingRoute from './Routers/testingRoute.js';
import searchHistoryRouter from './Routers/searchHistoryRouter.js';
import userRouter from './Routers/userRouter.js';
import eventsRouter from './Routers/eventsRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
dotenv.config();
app.use(cors());

//serve files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

//JWT SECRET: used it one time to generate token key: (Now saved in .env)
//console.log(crypto.randomBytes(64).toString('hex'));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use(signupRouter);
app.use(loginRouter);
app.use(testingRoute);
app.use(eventsRouter);
app.use(searchHistoryRouter);
app.use(userRouter);


app.listen(3001, '0.0.0.0', () => {
    console.log('Server is running on http://10.0.0.16:3001');
});