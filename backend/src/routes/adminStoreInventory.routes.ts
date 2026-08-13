import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import {
  createAdminStoreInventoryController,
  deleteAdminStoreInventoryController,
  getAdminStoreInventoriesController,
  getAdminStoreInventoryByIdController,
  updateAdminStoreInventoryController,
} from '../controllers/adminStoreInventory.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireStoreScope } from '../middleware/storeScope.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  validateAdminStoreInventoryListQuery,
  validateCreateAdminStoreInventory,
  validateUpdateAdminStoreInventory,
} from '../validators/adminStoreInventory.validator';

export const adminStoreInventoryRoutes = Router();

adminStoreInventoryRoutes.use(authenticate, requireStoreScope);

adminStoreInventoryRoutes.get(
  '/',
  (request: Request, response: Response, next: NextFunction) => {
    try {
      response.locals.inventoryListQuery = validateAdminStoreInventoryListQuery(
        request.query,
      );
      next();
    } catch (error) {
      next(error);
    }
  },
  asyncHandler(getAdminStoreInventoriesController),
);

adminStoreInventoryRoutes.get(
  '/:id',
  asyncHandler(getAdminStoreInventoryByIdController),
);

adminStoreInventoryRoutes.post(
  '/',
  (request: Request, response: Response, next: NextFunction) => {
    try {
      response.locals.createInventory = validateCreateAdminStoreInventory(
        request.body,
      );
      next();
    } catch (error) {
      next(error);
    }
  },
  asyncHandler(createAdminStoreInventoryController),
);

adminStoreInventoryRoutes.patch(
  '/:id',
  (request: Request, response: Response, next: NextFunction) => {
    try {
      response.locals.updateInventory = validateUpdateAdminStoreInventory(
        request.body,
      );
      next();
    } catch (error) {
      next(error);
    }
  },
  asyncHandler(updateAdminStoreInventoryController),
);

adminStoreInventoryRoutes.delete(
  '/:id',
  asyncHandler(deleteAdminStoreInventoryController),
);
