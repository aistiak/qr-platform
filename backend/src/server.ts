import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { apiRouter } from './routes';
import { attachSessionUser } from './utils/auth';

dotenv.config();

export const app = express();
const port = Number(process.env.PORT || 4000);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachSessionUser);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.use('/api', apiRouter);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
