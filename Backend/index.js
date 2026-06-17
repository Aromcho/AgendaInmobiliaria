import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './src/utils/db.js';
import router from './src/routes/index.router.js';
import { seedDatabase } from './src/utils/seed.js';
import errorHandler from './src/middelwares/errorHandler.mid.js';
import Task from './src/models/Task.model.js';
import { sendUpcomingEventReminders } from './src/utils/eventReminder.util.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:7000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'agenda-inmobiliaria-backend' });
});

app.use('/api', router);
app.use(errorHandler);

async function start() {
  await connectDB();
  await seedDatabase();
  // Migración: tareas viejas guardadas con el campo `text` pasan a `title`
  await Task.updateMany(
    { title: { $in: [null, ''] }, text: { $exists: true, $nin: [null, ''] } },
    [{ $set: { title: '$text' } }]
  );
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });

  sendUpcomingEventReminders().catch((error) => console.error(error));
  setInterval(() => {
    sendUpcomingEventReminders().catch((error) => console.error(error));
  }, 15 * 60 * 1000);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
