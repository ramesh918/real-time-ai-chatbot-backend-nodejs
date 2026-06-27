import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ConversationService } from '../services/ConversationService';
import logger from '../utils/logger';

const router = Router();

const CreateConversationSchema = z.object({
  name: z.string().min(1, 'Conversation name is required'),
});

const UpdateConversationSchema = z.object({
  name: z.string().min(1, 'Conversation name is required'),
});

// List user's conversations
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;

    const conversations = await ConversationService.getConversations(req.userId!, limit, offset);
    res.status(200).json({ conversations });
  } catch (error) {
    logger.error('Get conversations error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create conversation
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = CreateConversationSchema.parse(req.body);
    const conversation = await ConversationService.createConversation(req.userId!, name);
    res.status(201).json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
    } else {
      logger.error('Create conversation error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get conversation messages
router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;

    const conversation = await ConversationService.getConversation(id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const { messages, total } = await ConversationService.getConversationMessages(id, limit, offset);
    res.status(200).json({ messages, total, limit, offset });
  } catch (error) {
    logger.error('Get messages error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update conversation
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name } = UpdateConversationSchema.parse(req.body);

    const conversation = await ConversationService.getConversation(id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const updated = await ConversationService.updateConversation(id, name);
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
    } else {
      logger.error('Update conversation error', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete conversation
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const conversation = await ConversationService.getConversation(id);
    if (!conversation || conversation.user_id !== req.userId) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const deleted = await ConversationService.deleteConversation(id);
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  } catch (error) {
    logger.error('Delete conversation error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
