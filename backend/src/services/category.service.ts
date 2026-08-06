import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Category from '../models/category.model';
import type { ApiError } from '../types/api';
import type {
  CategoryInput,
  CategoryUpdateInput,
} from '../validators/category.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

function validateCategoryId(id: string): void {
  if (!isValidObjectId(id)) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }
}

export async function getCategories() {
  return Category.find({ active: true, deletedAt: null })
    .sort({ displayOrder: 1, sortOrder: 1 })
    .lean();
}

export async function getCategoryById(id: string) {
  validateCategoryId(id);

  const category = await Category.findOne({
    _id: id,
    active: true,
    deletedAt: null,
  }).lean();

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  return category;
}

export async function createCategory(input: CategoryInput, userId: string) {
  return Category.create({ ...input, createdBy: userId, updatedBy: userId });
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
  userId: string,
) {
  validateCategoryId(id);

  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...input, updatedBy: userId },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  return category;
}

export async function deleteCategory(id: string, userId: string) {
  validateCategoryId(id);

  const category = await Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), deletedBy: userId, updatedBy: userId },
    { new: true },
  );

  if (!category) {
    throw serviceError('Category not found.', HTTP_STATUS.NOT_FOUND);
  }

  return category;
}
