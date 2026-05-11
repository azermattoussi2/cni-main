import { Router } from 'express';
import { MessageController } from '../controllers/index';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate, sendMessageSchema, messageThreadParamsSchema } from '../middlewares/validation.middleware';
import { INTERNAL_STAFF_ROLES } from '../constants/roles';

const router = Router();

const rolesMessagerie = [...INTERNAL_STAFF_ROLES] as const;

router.use(authenticate, authorize(...rolesMessagerie));

router.get('/contacts', MessageController.contacts);
router.get('/unread-count', MessageController.unreadCount);
router.get('/thread/:otherId', validate(messageThreadParamsSchema), MessageController.thread);
router.post('/', validate(sendMessageSchema), MessageController.send);

export default router;
