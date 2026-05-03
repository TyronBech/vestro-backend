import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CreateTransactionSchema } from '../schemas/transaction.schema';

export const transactionRouter = Router();

transactionRouter.post('/', authenticateJWT, validate(CreateTransactionSchema), TransactionController.addTransaction);
transactionRouter.get('/', authenticateJWT, TransactionController.listTransactions);
