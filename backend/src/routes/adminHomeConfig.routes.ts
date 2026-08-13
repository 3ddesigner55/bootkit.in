import { Router } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import { ROLES } from '../constants/roles';
import {
  createDraftConfigHandler,
  getDraftConfigHandler,
  getHistoryHandler,
  previewConfigHandler,
  publishConfigHandler,
  saveDraftConfigHandler,
  removeSectionHandler,
} from '../controllers/adminHomeConfig.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import HomeSection from '../models/homeSection.model';
import Category from '../models/category.model';
import { isValidObjectId } from 'mongoose';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// Main Versioned Merchandising Endpoints
router.get('/draft', getDraftConfigHandler);
router.post('/draft/create', createDraftConfigHandler);
router.post('/draft', saveDraftConfigHandler);
router.post('/draft/remove-section', removeSectionHandler);
router.post('/publish', publishConfigHandler);
router.get('/preview', previewConfigHandler);
router.get('/history', getHistoryHandler);


// Backward-compatible Best Sellers endpoint
router.get('/best-sellers', async (req, res, next) => {
  try {
    let section = await HomeSection.findOne({ key: 'bestSellers' }).lean();
    if (!section) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Default Best Sellers config retrieved.',
        data: {
          key: 'bestSellers',
          title: 'Best Sellers',
          active: true,
          displayType: 'categoryCards',
          items: [],
        },
      });
    }
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Best Sellers config retrieved.',
      data: section,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/best-sellers', async (req, res, next) => {
  try {
    const { title, active, items } = req.body;
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Title is required.',
      });
    }

    if (!Array.isArray(items)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Items must be an array.',
      });
    }

    const validatedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.category || !isValidObjectId(item.category)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Item at index ${i} has invalid category ID.`,
        });
      }

      const categoryExists = await Category.exists({
        _id: item.category,
        active: true,
        deletedAt: null,
      });

      if (!categoryExists) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Category at index ${i} does not exist or is inactive.`,
        });
      }

      validatedItems.push({
        category: item.category,
        productMode: item.productMode === 'manual' ? 'manual' : 'auto',
        manualProductIds: Array.isArray(item.manualProductIds)
          ? item.manualProductIds.filter((id: string) => isValidObjectId(id))
          : [],
        active: item.active !== false,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : i + 1,
      });
    }

    const updated = await HomeSection.findOneAndUpdate(
      { key: 'bestSellers' },
      {
        $set: {
          title: title.trim(),
          active: active !== false,
          items: validatedItems,
          updatedBy: req.user?.id,
        },

      },
      { new: true, upsert: true },
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Best Sellers config updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
