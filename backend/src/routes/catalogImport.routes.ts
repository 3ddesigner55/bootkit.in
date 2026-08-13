import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ROLES } from '../constants/roles';
import { csvUpload } from '../middleware/upload.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  parseAndValidateBrands,
  parseAndValidateCategories,
  parseAndValidateProducts,
  parseAndValidateInventory,
  executeImportBrands,
  executeImportCategories,
  executeImportProducts,
  executeImportInventory
} from '../services/catalogImport.service';
import { sendSuccess } from '../utils/apiResponse';

export const adminCatalogImportRoutes = Router();

adminCatalogImportRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

adminCatalogImportRoutes.post(
  '/validate',
  csvUpload.single('csv'),
  asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as string;
    const hubId = req.query.hubId as string;

    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No CSV file uploaded.',
      });
    }

    let validationResult;
    switch (type) {
      case 'brands':
        validationResult = await parseAndValidateBrands(req.file.buffer);
        break;
      case 'categories':
        validationResult = await parseAndValidateCategories(req.file.buffer);
        break;
      case 'products':
        validationResult = await parseAndValidateProducts(req.file.buffer, hubId);
        break;
      case 'inventory':
        validationResult = await parseAndValidateInventory(req.file.buffer);
        break;
      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid import type. Allowed types: brands, categories, products, inventory.',
        });
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      validationResult,
      'CSV file validated successfully.',
    );
  }),
);

adminCatalogImportRoutes.post(
  '/execute',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, action, items, hubId } = req.body;

    if (!type || !action || !items || !Array.isArray(items)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Fields type, action, and items array are required.',
      });
    }

    if (action !== 'skip' && action !== 'update') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Action must be "skip" or "update".',
      });
    }

    let result;
    switch (type) {
      case 'brands':
        result = await executeImportBrands(items, action, req.user!.id);
        break;
      case 'categories':
        result = await executeImportCategories(items, action, req.user!.id);
        break;
      case 'products':
        result = await executeImportProducts(items, action, req.user!.id, hubId);
        break;
      case 'inventory':
        result = await executeImportInventory(items, action, req.user!.id);
        break;
      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid import type. Allowed types: brands, categories, products, inventory.',
        });
    }

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      result,
      'CSV records imported successfully.',
    );
  }),
);

adminCatalogImportRoutes.get(
  '/templates/:type',
  asyncHandler(async (req: Request, res: Response) => {
    const type = req.params.type;

    let csvContent = '';
    let fileName = '';

    switch (type) {
      case 'brands':
        csvContent = 'name,slug,description,logo,banner,website,featured,active,displayOrder\n';
        fileName = 'brands_template.csv';
        break;
      case 'categories':
        csvContent = 'name,slug,parentCategory,image,icon,active,sortOrder\n';
        fileName = 'categories_template.csv';
        break;
      case 'products':
        csvContent = 'name,sku,slug,category,brand,sellingPrice,mrp,stock,unit,barcode,description,deliveryMinutes,thumbnail,gallery,videoUrl,active,featured,bestseller,attributes,highlights,ingredients,storageInstructions,usageInstructions,replacementPolicy\n';
        fileName = 'products_template.csv';
        break;
      case 'inventory':
        csvContent = 'store,product,variantSku,stock,reservedStock,sellingPrice,mrp,costPrice,discountPercent,active,trackInventory\n';
        fileName = 'inventory_template.csv';
        break;
      default:
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid template type. Allowed types: brands, categories, products, inventory.',
        });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(HTTP_STATUS.OK).send(csvContent);
  }),
);
