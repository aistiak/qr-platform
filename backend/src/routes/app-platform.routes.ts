import { Router } from 'express';
import { ApiTokenController } from '../controllers/api-token.controller';
import { requireSessionAuth } from '../utils/auth';

const apiTokenController = new ApiTokenController();

export const appPlatformRouter = Router();

appPlatformRouter.post('/tokens', requireSessionAuth, apiTokenController.create.bind(apiTokenController));
appPlatformRouter.get('/tokens', requireSessionAuth, apiTokenController.list.bind(apiTokenController));
appPlatformRouter.get('/tokens/:id', requireSessionAuth, apiTokenController.details.bind(apiTokenController));
appPlatformRouter.delete('/tokens/:id', requireSessionAuth, apiTokenController.remove.bind(apiTokenController));
