import type { Request, Response } from 'express';
import { ApiTokenService } from '../services/api-token.service';
import { handleControllerError } from './controller-error';

const apiTokenService = new ApiTokenService();

export class ApiTokenController {
  async create(req: Request, res: Response) {
    try {
      const response = await apiTokenService.create(req.user!.id, req.body);
      return res.status(201).json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to create API token');
    }
  }

  async list(req: Request, res: Response) {
    try {
      const response = await apiTokenService.list(req.user!.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch API tokens');
    }
  }

  async details(req: Request, res: Response) {
    try {
      const response = await apiTokenService.details(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to fetch API token');
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const response = await apiTokenService.remove(req.user!.id, req.params.id);
      return res.json(response);
    } catch (error) {
      return handleControllerError(res, error, 'Failed to delete API token');
    }
  }
}
