import { Router, type Request, type Response } from 'express';

import { ROLES } from '../constants/roles';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createCategoryController,
  deleteCategoryController,
  getAdminCategoriesController,
  getCategoryOptionsController,
  getCategoriesController,
  getCategoryController,
  getCategoryTreeController,
  getCategoryBySlugController,
  getCategoryProductsController,
  uploadCategoryImagesController,
  updateCategoryController,
  reorderCategoriesController,
} from '../controllers/category.controller';
import {
  getAdminCategorySummary,
  getAdminCategoryTree,
  getCategoryCsvTemplate,
  parseAndValidateCategoryCsv,
  executeCategoryCsvImport,
  deleteCategory,
} from '../services/category.service';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const categoryRoutes = Router();
export const adminCategoryRoutes = Router();

// Public / Customer category routes
categoryRoutes.get('/tree', asyncHandler(getCategoryTreeController));
categoryRoutes.get('/slug/:slug/products', asyncHandler(getCategoryProductsController));
categoryRoutes.get('/slug/:slug', asyncHandler(getCategoryBySlugController));
categoryRoutes.get('/', asyncHandler(getCategoriesController));
categoryRoutes.get('/:id', asyncHandler(getCategoryController));

// Admin Category Routes
adminCategoryRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

adminCategoryRoutes.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const summary = await getAdminCategorySummary();
  res.status(HTTP_STATUS.OK).json({ success: true, summary });
}));

adminCategoryRoutes.get('/tree', asyncHandler(async (req: Request, res: Response) => {
  const tree = await getAdminCategoryTree();
  res.status(HTTP_STATUS.OK).json({ success: true, tree });
}));

adminCategoryRoutes.get('/import/template', asyncHandler(async (req: Request, res: Response) => {
  const template = getCategoryCsvTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="categories_template.csv"');
  res.status(HTTP_STATUS.OK).send(template);
}));

adminCategoryRoutes.post('/import/validate', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  let csvText = '';
  if (req.file) {
    csvText = req.file.buffer.toString('utf8');
  } else if (req.body.csvText) {
    csvText = req.body.csvText;
  } else {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'CSV file or csvText is required.' });
    return;
  }

  const result = await parseAndValidateCategoryCsv(csvText);
  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
}));

adminCategoryRoutes.post('/import/execute', asyncHandler(async (req: Request, res: Response) => {
  const { rows, mode = 'CREATE_ONLY' } = req.body;
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Valid rows array is required for execution.' });
    return;
  }

  const result = await executeCategoryCsvImport(rows, mode, req.user!.id);
  res.status(HTTP_STATUS.OK).json({ success: true, ...result });
}));

adminCategoryRoutes.get('/options', asyncHandler(getCategoryOptionsController));

adminCategoryRoutes.get('/', asyncHandler(getAdminCategoriesController));

adminCategoryRoutes.post(
  '/upload',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  asyncHandler(uploadCategoryImagesController),
);

adminCategoryRoutes.post('/', asyncHandler(createCategoryController));

adminCategoryRoutes.patch('/:id', asyncHandler(updateCategoryController));

adminCategoryRoutes.delete('/:id', asyncHandler(deleteCategoryController));

adminCategoryRoutes.post('/:id/archive', asyncHandler(async (req: Request, res: Response) => {
  const category = await deleteCategory(String(req.params.id), req.user!.id);
  res.status(HTTP_STATUS.OK).json({ success: true, message: 'Category archived successfully.', category });
}));

adminCategoryRoutes.post('/reorder', asyncHandler(reorderCategoriesController));
