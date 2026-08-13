import { Router } from 'express';

import { ROLES } from '../constants/roles';
import { HTTP_STATUS } from '../constants/httpStatus';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import HomeSection from '../models/homeSection.model';
import Category from '../models/category.model';
import { isValidObjectId } from 'mongoose';

export const adminHomeSectionRoutes = Router();

adminHomeSectionRoutes.use(authenticate);
adminHomeSectionRoutes.use(authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// GET /api/admin/home-config/best-sellers
adminHomeSectionRoutes.get(
  '/best-sellers',
  asyncHandler(async (request, response) => {
    let section = await HomeSection.findOne({ key: 'bestSellers' }).lean();

    if (!section) {
      // Return a default blank config if not seeded yet
      return response.status(HTTP_STATUS.OK).json({
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

    return response.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Best Sellers config retrieved.',
      data: section,
    });
  }),
);

// PUT /api/admin/home-config/best-sellers
adminHomeSectionRoutes.put(
  '/best-sellers',
  asyncHandler(async (request, response) => {
    const { title, active, items } = request.body;

    if (typeof title !== 'string' || !title.trim()) {
      return response.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Title is required.',
      });
    }

    if (!Array.isArray(items)) {
      return response.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Items must be an array.',
      });
    }

    // Validate categories and build items array
    const validatedItems = [];
    for (const item of items) {
      if (!item.category || !isValidObjectId(item.category)) {
        return response.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Invalid category ID: ${item.category}`,
        });
      }

      const categoryExists = await Category.findOne({
        _id: item.category,
        deletedAt: null,
      });

      if (!categoryExists) {
        return response.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: `Category not found or deleted: ${item.category}`,
        });
      }

      validatedItems.push({
        category: item.category,
        productMode: item.productMode === 'manual' ? 'manual' : 'auto',
        manualProductIds: Array.isArray(item.manualProductIds)
          ? item.manualProductIds
          : [],
        active: typeof item.active === 'boolean' ? item.active : true,
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
      });
    }

    const updatedSection = await HomeSection.findOneAndUpdate(
      { key: 'bestSellers' },
      {
        $set: {
          title: title.trim(),
          active: typeof active === 'boolean' ? active : true,
          items: validatedItems,
          updatedBy: request.user!.id,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return response.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Best Sellers config updated successfully.',
      data: updatedSection,
    });
  }),
);
