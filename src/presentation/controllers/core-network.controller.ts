import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CoreNetworkService } from '../../services/core-network.service';

export class CoreNetworkController {
  static async listNetwork(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await CoreNetworkService.listNetwork(userId);

    if (!result.ok) {
      res.status(500).json({ error: 'Failed to retrieve core network' });
      return;
    }

    res.json(result.value);
  }

  static async addNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const result = await CoreNetworkService.addNode(userId, req.body);

    if (!result.ok) {
      switch (result.error) {
        case 'MACRO_ASSET_NOT_FOUND':
          res.status(404).json({ error: 'Macro asset not found' });
          break;
        case 'PARENT_NOT_FOUND':
          res.status(404).json({ error: 'Parent node not found' });
          break;
        case 'EXCEEDS_LIMIT':
          res.status(400).json({ error: 'Percentage allocation exceeds the parent limits (or 100% for root nodes)' });
          break;
        default:
          res.status(500).json({ error: 'Internal server error' });
      }
      return;
    }

    res.status(201).json(result.value);
  }

  static async updateNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const nodeId = req.params.id as string;
    const result = await CoreNetworkService.updateNode(userId, nodeId, req.body);

    if (!result.ok) {
      switch (result.error) {
        case 'NOT_FOUND':
          res.status(404).json({ error: 'Node not found' });
          break;
        case 'EXCEEDS_LIMIT':
          res.status(400).json({ error: 'Percentage allocation exceeds the parent limits (or 100% for root nodes)' });
          break;
        default:
          res.status(500).json({ error: 'Internal server error' });
      }
      return;
    }

    res.json(result.value);
  }

  static async deleteNode(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const nodeId = req.params.id as string;
    const result = await CoreNetworkService.deleteNode(userId, nodeId);

    if (!result.ok) {
      if (result.error === 'NOT_FOUND') {
        res.status(404).json({ error: 'Node not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
      return;
    }

    res.status(204).send();
  }
}
