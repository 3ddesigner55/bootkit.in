import { HTTP_STATUS } from '../constants/httpStatus';
import Category from '../models/category.model';
import Brand from '../models/brand.model';
import Product from '../models/product.model';
import StoreInventory from '../models/storeInventory.model';
import Store from '../models/store.model';
import CatalogAudit from '../models/catalogAudit.model';
import User from '../models/user.model';
import { isValidObjectId, Types } from 'mongoose';

export type CsvRowPreview = {
  index: number;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
  data?: any;
  raw: Record<string, string>;
};

export type CsvImportResult = {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: CsvRowPreview[];
};

function serviceError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function parseCsv(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell);
      result.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (row.length > 0 || cell !== '') {
    row.push(cell);
    result.push(row);
  }

  return result.filter((r) => r.some((c) => c.trim() !== ''));
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  const clean = value.trim().toLowerCase();
  if (['true', 'yes', '1', 'y'].includes(clean)) return true;
  if (['false', 'no', '0', 'n'].includes(clean)) return false;
  return defaultValue;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// -------------------------------------------------------------------------
// BRANDS IMPORT & VALIDATION
// -------------------------------------------------------------------------
export async function parseAndValidateBrands(buffer: Buffer): Promise<CsvImportResult> {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length <= 1) {
    throw serviceError('CSV file has no data rows.', HTTP_STATUS.BAD_REQUEST);
  }

  const headers = parsedRows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['name', 'slug'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw serviceError(`Missing required CSV columns: ${missing.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const rows: CsvRowPreview[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 1; i < parsedRows.length; i++) {
    const rowData = parsedRows[i];
    const errors: string[] = [];
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, idx) => { rawRecord[h] = rowData[idx] || ''; });

    const name = rawRecord['name']?.trim() || '';
    const slug = rawRecord['slug']?.trim()?.toLowerCase() || createSlug(name);
    const description = rawRecord['description']?.trim() || '';
    const logo = rawRecord['logo']?.trim() || '';
    const banner = rawRecord['banner']?.trim() || '';
    const website = rawRecord['website']?.trim() || '';
    const active = parseBoolean(rawRecord['active'], true);
    const featured = parseBoolean(rawRecord['featured'], false);
    const displayOrder = parseInt(rawRecord['displayorder'] || '0', 10) || 0;

    if (!name) errors.push('Brand name is required.');
    if (!slug) errors.push('Brand slug is required.');

    if (website && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(website)) {
      errors.push('Website must be a valid HTTP/HTTPS URL.');
    }

    if (seenSlugs.has(slug)) {
      errors.push('Duplicate slug in CSV.');
    } else {
      seenSlugs.add(slug);
    }

    let isDuplicateDb = false;
    if (slug && errors.length === 0) {
      const existing = await Brand.findOne({ slug, deletedAt: null }).lean();
      if (existing) isDuplicateDb = true;
    }

    const payload = { name, slug, description, logo, banner, website, active, featured, displayOrder };
    const status = errors.length > 0 ? 'invalid' : isDuplicateDb ? 'duplicate' : 'valid';

    rows.push({ index: i, status, errors, raw: rawRecord, ...(status !== 'invalid' ? { data: payload } : {}) });
  }

  return getResultSummary(rows, parsedRows.length - 1);
}

// -------------------------------------------------------------------------
// CATEGORIES IMPORT & VALIDATION
// -------------------------------------------------------------------------
export async function parseAndValidateCategories(buffer: Buffer): Promise<CsvImportResult> {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length <= 1) {
    throw serviceError('CSV file has no data rows.', HTTP_STATUS.BAD_REQUEST);
  }

  const headers = parsedRows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['name', 'slug'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw serviceError(`Missing required CSV columns: ${missing.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const rows: CsvRowPreview[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 1; i < parsedRows.length; i++) {
    const rowData = parsedRows[i];
    const errors: string[] = [];
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, idx) => { rawRecord[h] = rowData[idx] || ''; });

    const name = rawRecord['name']?.trim() || '';
    const slug = rawRecord['slug']?.trim()?.toLowerCase() || createSlug(name);
    const parentSlug = rawRecord['parentcategory']?.trim()?.toLowerCase() || '';
    const image = rawRecord['image']?.trim() || '';
    const icon = rawRecord['icon']?.trim() || '';
    const active = parseBoolean(rawRecord['active'], true);
    const sortOrder = parseInt(rawRecord['sortorder'] || '0', 10) || 0;

    if (!name) errors.push('Category name is required.');
    if (!slug) errors.push('Category slug is required.');

    if (seenSlugs.has(slug)) {
      errors.push('Duplicate slug in CSV.');
    } else {
      seenSlugs.add(slug);
    }

    let parentId: string | null = null;
    let computedLevel = 1;

    if (parentSlug) {
      if (parentSlug === slug) {
        errors.push('A category cannot be its own parent.');
      } else {
        const parentDoc = await Category.findOne({ slug: parentSlug, deletedAt: null }).lean();
        if (!parentDoc) {
          errors.push(`Parent category slug "${parentSlug}" not found in database.`);
        } else {
          parentId = parentDoc._id.toString();
          // Calculate parent level
          const { computeCategoryLevelAndPath } = await import('./category.service');
          const { level } = await computeCategoryLevelAndPath(parentDoc);
          computedLevel = level + 1;
          if (computedLevel > 3) {
            errors.push(`Maximum category depth of 3 levels exceeded. "${parentSlug}" is level ${level} and cannot be a parent.`);
          }
        }
      }
    }

    let isDuplicateDb = false;
    if (slug && errors.length === 0) {
      const existing = await Category.findOne({ slug, deletedAt: null }).lean();
      if (existing) isDuplicateDb = true;
    }

    const payload = { name, slug, parentCategory: parentId, image, icon, active, sortOrder, level: computedLevel };
    const status = errors.length > 0 ? 'invalid' : isDuplicateDb ? 'duplicate' : 'valid';

    rows.push({ index: i, status, errors, raw: rawRecord, ...(status !== 'invalid' ? { data: payload } : {}) });
  }

  return getResultSummary(rows, parsedRows.length - 1);
}

// -------------------------------------------------------------------------
// PRODUCTS IMPORT & VALIDATION
// -------------------------------------------------------------------------
export async function parseAndValidateProducts(buffer: Buffer, hubId?: string): Promise<CsvImportResult> {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length <= 1) {
    throw serviceError('CSV file has no data rows.', HTTP_STATUS.BAD_REQUEST);
  }

  const headers = parsedRows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['name', 'sku', 'category', 'sellingprice', 'stock'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw serviceError(`Missing required CSV columns: ${missing.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const rows: CsvRowPreview[] = [];
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (let i = 1; i < parsedRows.length; i++) {
    const rowData = parsedRows[i];
    const errors: string[] = [];
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, idx) => { rawRecord[h] = rowData[idx] || ''; });

    const name = rawRecord['name']?.trim() || '';
    const sku = rawRecord['sku']?.trim()?.toUpperCase() || '';
    const slug = rawRecord['slug']?.trim()?.toLowerCase() || createSlug(name);
    const categoryVal = rawRecord['category']?.trim() || '';
    const brandVal = rawRecord['brand']?.trim() || '';
    const sellingPrice = parseFloat(rawRecord['sellingprice'] || '0') || 0;
    const mrp = parseFloat(rawRecord['mrp'] || '0') || sellingPrice;
    const stock = parseInt(rawRecord['stock'] || '0', 10) || 0;
    const barcode = rawRecord['barcode']?.trim() || '';
    const active = parseBoolean(rawRecord['active'], true);

    if (!name) errors.push('Product name is required.');
    if (!sku) errors.push('SKU is required.');
    if (!categoryVal) errors.push('Category is required.');

    if (seenSkus.has(sku)) {
      errors.push('Duplicate SKU in CSV.');
    } else {
      seenSkus.add(sku);
    }

    if (seenSlugs.has(slug)) {
      errors.push('Duplicate slug in CSV.');
    } else {
      seenSlugs.add(slug);
    }

    let categoryId = '';
    if (categoryVal) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: categoryVal.toLowerCase() }, { name: new RegExp(`^${categoryVal}$`, 'i') }],
        deletedAt: null,
      }).lean();
      if (!categoryDoc) {
        errors.push(`Category "${categoryVal}" not found.`);
      } else {
        const { computeCategoryLevelAndPath } = await import('./category.service');
        const { level } = await computeCategoryLevelAndPath(categoryDoc);
        if (level !== 3) {
          errors.push(`Category "${categoryVal}" must be a Level-3 Leaf Category. Assigned category level is ${level}.`);
        } else {
          categoryId = categoryDoc._id.toString();
        }
      }
    }

    let brandId = '';
    if (brandVal) {
      const brandDoc = await Brand.findOne({
        $or: [{ slug: brandVal.toLowerCase() }, { name: new RegExp(`^${brandVal}$`, 'i') }],
        deletedAt: null,
      }).lean();
      if (!brandDoc) {
        errors.push(`Brand "${brandVal}" not found.`);
      } else {
        brandId = brandDoc._id.toString();
      }
    }

    if (sellingPrice < 0) errors.push('Selling price cannot be negative.');
    if (mrp < 0) errors.push('MRP cannot be negative.');
    if (sellingPrice > mrp) errors.push('Selling price cannot exceed MRP.');
    if (stock < 0) errors.push('Stock cannot be negative.');

    let isDuplicateDb = false;
    if (sku && errors.length === 0) {
      const existing = await Product.findOne({ sku, deletedAt: null }).lean();
      if (existing) isDuplicateDb = true;
    }

    const payload = {
      name,
      sku,
      slug,
      category: categoryId,
      brand: brandId || undefined,
      sellingPrice,
      mrp,
      stock,
      barcode: barcode || undefined,
      active,
      unit: rawRecord['unit'] || 'each',
      description: rawRecord['description'] || '',
      thumbnail: rawRecord['thumbnail'] || '',
    };
    const status = errors.length > 0 ? 'invalid' : isDuplicateDb ? 'duplicate' : 'valid';

    rows.push({ index: i, status, errors, raw: rawRecord, ...(status !== 'invalid' ? { data: payload } : {}) });
  }

  return getResultSummary(rows, parsedRows.length - 1);
}

// -------------------------------------------------------------------------
// INVENTORY IMPORT & VALIDATION
// -------------------------------------------------------------------------
export async function parseAndValidateInventory(buffer: Buffer): Promise<CsvImportResult> {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length <= 1) {
    throw serviceError('CSV file has no data rows.', HTTP_STATUS.BAD_REQUEST);
  }

  const headers = parsedRows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = ['store', 'product', 'stock', 'sellingprice', 'mrp'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw serviceError(`Missing required CSV columns: ${missing.join(', ')}`, HTTP_STATUS.BAD_REQUEST);
  }

  const rows: CsvRowPreview[] = [];
  const seenCompoundKeys = new Set<string>();

  for (let i = 1; i < parsedRows.length; i++) {
    const rowData = parsedRows[i];
    const errors: string[] = [];
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, idx) => { rawRecord[h] = rowData[idx] || ''; });

    const storeVal = rawRecord['store']?.trim() || '';
    const productVal = rawRecord['product']?.trim() || '';
    const stock = parseInt(rawRecord['stock'] || '0', 10) || 0;
    const reservedStock = parseInt(rawRecord['reservedstock'] || '0', 10) || 0;
    const sellingPrice = parseFloat(rawRecord['sellingprice'] || '0') || 0;
    const mrp = parseFloat(rawRecord['mrp'] || '0') || sellingPrice;
    const active = parseBoolean(rawRecord['active'], true);

    if (!storeVal) errors.push('Store code or ID is required.');
    if (!productVal) errors.push('Product SKU or ID is required.');

    let storeId = '';
    if (storeVal) {
      const storeDoc = await Store.findOne({
        $or: [
          { _id: isValidObjectId(storeVal) ? storeVal : new Types.ObjectId() },
          { code: storeVal.toUpperCase() },
          { slug: storeVal.toLowerCase() }
        ],
        deletedAt: null
      }).lean();
      if (!storeDoc) {
        errors.push(`Store "${storeVal}" not found.`);
      } else {
        storeId = storeDoc._id.toString();
      }
    }

    let productId = '';
    let productSku = '';
    if (productVal) {
      const productDoc = await Product.findOne({
        $or: [
          { _id: isValidObjectId(productVal) ? productVal : new Types.ObjectId() },
          { sku: productVal.toUpperCase() }
        ],
        deletedAt: null
      }).lean();
      if (!productDoc) {
        errors.push(`Product "${productVal}" not found.`);
      } else {
        productId = productDoc._id.toString();
        productSku = productDoc.sku;
      }
    }

    const key = `${storeId}_${productId}`;
    if (seenCompoundKeys.has(key)) {
      errors.push('Duplicate inventory record for same Store and Product in CSV.');
    } else {
      seenCompoundKeys.add(key);
    }

    if (sellingPrice < 0) errors.push('Selling price cannot be negative.');
    if (mrp < 0) errors.push('MRP cannot be negative.');
    if (sellingPrice > mrp) errors.push('Selling price cannot exceed MRP.');
    if (stock < 0) errors.push('Stock cannot be negative.');
    if (reservedStock < 0) errors.push('Reserved stock cannot be negative.');
    if (reservedStock > stock) errors.push('Reserved stock cannot exceed total stock.');

    let isDuplicateDb = false;
    if (storeId && productId && errors.length === 0) {
      const existing = await StoreInventory.findOne({ store: storeId, product: productId, deletedAt: null }).lean();
      if (existing) isDuplicateDb = true;
    }

    const payload = {
      store: storeId,
      product: productId,
      variantSku: productSku,
      stock,
      reservedStock,
      sellingPrice,
      mrp,
      active,
    };
    const status = errors.length > 0 ? 'invalid' : isDuplicateDb ? 'duplicate' : 'valid';

    rows.push({ index: i, status, errors, raw: rawRecord, ...(status !== 'invalid' ? { data: payload } : {}) });
  }

  return getResultSummary(rows, parsedRows.length - 1);
}

// -------------------------------------------------------------------------
// EXECUTION WRITES LOGIC
// -------------------------------------------------------------------------
export async function executeImportBrands(items: any[], action: 'skip' | 'update', userId: string) {
  let importedCount = 0;
  const actor = await User.findById(userId);

  for (const b of items) {
    const existing = await Brand.findOne({ slug: b.slug, deletedAt: null });
    if (existing) {
      if (action === 'update') {
        const before = existing.toObject();
        Object.assign(existing, { ...b, updatedBy: userId });
        await existing.save();
        await CatalogAudit.create({
          actor: userId as any,
          role: actor?.role || 'ADMIN',
          action: 'BRAND_IMPORTED_UPDATE',
          entityType: 'BRAND',
          entityId: existing._id,
          beforeValue: before,
          afterValue: existing.toObject(),
        });
        importedCount++;
      }
    } else {
      const created = await Brand.create({ ...b, createdBy: userId, updatedBy: userId });
      await CatalogAudit.create({
        actor: userId as any,
        role: actor?.role || 'ADMIN',
        action: 'BRAND_IMPORTED_CREATE',
        entityType: 'BRAND',
        entityId: created._id,
        afterValue: created.toObject(),
      });
      importedCount++;
    }
  }
  return { importedCount };
}

export async function executeImportCategories(items: any[], action: 'skip' | 'update', userId: string) {
  let importedCount = 0;
  const actor = await User.findById(userId);

  for (const c of items) {
    const existing = await Category.findOne({ slug: c.slug, deletedAt: null });
    if (existing) {
      if (action === 'update') {
        const before = existing.toObject();
        Object.assign(existing, { ...c, updatedBy: userId });
        await existing.save();
        await CatalogAudit.create({
          actor: userId as any,
          role: actor?.role || 'ADMIN',
          action: 'CATEGORY_IMPORTED_UPDATE',
          entityType: 'CATEGORY',
          entityId: existing._id,
          beforeValue: before,
          afterValue: existing.toObject(),
        });
        importedCount++;
      }
    } else {
      const created = await Category.create({ ...c, createdBy: userId, updatedBy: userId });
      await CatalogAudit.create({
        actor: userId as any,
        role: actor?.role || 'ADMIN',
        action: 'CATEGORY_IMPORTED_CREATE',
        entityType: 'CATEGORY',
        entityId: created._id,
        afterValue: created.toObject(),
      });
      importedCount++;
    }
  }
  return { importedCount };
}

export async function executeImportProducts(items: any[], action: 'skip' | 'update', userId: string, hubId?: string) {
  let importedCount = 0;
  const actor = await User.findById(userId);

  for (const p of items) {
    const existing = await Product.findOne({ sku: p.sku, deletedAt: null });
    let productDoc: any = null;

    if (existing) {
      if (action === 'update') {
        const before = existing.toObject();
        Object.assign(existing, { ...p, updatedBy: userId });
        productDoc = await existing.save();
        await CatalogAudit.create({
          actor: userId as any,
          role: actor?.role || 'ADMIN',
          action: 'PRODUCT_IMPORTED_UPDATE',
          entityType: 'PRODUCT',
          entityId: existing._id,
          beforeValue: before,
          afterValue: existing.toObject(),
        });
        importedCount++;
      } else {
        productDoc = existing;
      }
    } else {
      productDoc = await Product.create({ ...p, createdBy: userId, updatedBy: userId });
      await CatalogAudit.create({
        actor: userId as any,
        role: actor?.role || 'ADMIN',
        action: 'PRODUCT_IMPORTED_CREATE',
        entityType: 'PRODUCT',
        entityId: productDoc._id,
        afterValue: productDoc.toObject(),
      });
      importedCount++;
    }

    // Write to Hub StoreInventory if hubId is provided
    if (hubId && productDoc) {
      const inventory = await StoreInventory.findOne({ store: hubId, product: productDoc._id, deletedAt: null });
      if (inventory) {
        if (action === 'update') {
          const beforeInv = inventory.toObject();
          inventory.stock = p.stock;
          inventory.sellingPrice = p.sellingPrice;
          inventory.mrp = p.mrp;
          inventory.updatedBy = userId;
          await inventory.save();
          await CatalogAudit.create({
            actor: userId as any,
            role: actor?.role || 'ADMIN',
            action: 'INVENTORY_IMPORTED_UPDATE',
            entityType: 'STORE_INVENTORY',
            entityId: inventory._id,
            beforeValue: beforeInv,
            afterValue: inventory.toObject(),
          });
        }
      } else {
        const createdInv = await StoreInventory.create({
          store: hubId,
          product: productDoc._id,
          variantSku: productDoc.sku,
          stock: p.stock,
          reservedStock: 0,
          sellingPrice: p.sellingPrice,
          mrp: p.mrp,
          active: true,
          createdBy: userId,
          updatedBy: userId,
        });
        await CatalogAudit.create({
          actor: userId as any,
          role: actor?.role || 'ADMIN',
          action: 'INVENTORY_IMPORTED_CREATE',
          entityType: 'STORE_INVENTORY',
          entityId: createdInv._id,
          afterValue: createdInv.toObject(),
        });
      }
    }
  }
  return { importedCount };
}

export async function executeImportInventory(items: any[], action: 'skip' | 'update', userId: string) {
  let importedCount = 0;
  const actor = await User.findById(userId);

  for (const inv of items) {
    const existing = await StoreInventory.findOne({ store: inv.store, product: inv.product, deletedAt: null });
    if (existing) {
      if (action === 'update') {
        const before = existing.toObject();
        Object.assign(existing, { ...inv, updatedBy: userId });
        await existing.save();
        await CatalogAudit.create({
          actor: userId as any,
          role: actor?.role || 'ADMIN',
          action: 'INVENTORY_IMPORTED_UPDATE',
          entityType: 'STORE_INVENTORY',
          entityId: existing._id,
          beforeValue: before,
          afterValue: existing.toObject(),
        });
        importedCount++;
      }
    } else {
      const created = await StoreInventory.create({ ...inv, createdBy: userId, updatedBy: userId });
      await CatalogAudit.create({
        actor: userId as any,
        role: actor?.role || 'ADMIN',
        action: 'INVENTORY_IMPORTED_CREATE',
        entityType: 'STORE_INVENTORY',
        entityId: created._id,
        afterValue: created.toObject(),
      });
      importedCount++;
    }
  }
  return { importedCount };
}

function getResultSummary(rows: CsvRowPreview[], totalRows: number): CsvImportResult {
  const validCount = rows.filter((r) => r.status === 'valid').length;
  const invalidCount = rows.filter((r) => r.status === 'invalid').length;
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length;

  return { totalRows, validCount, invalidCount, duplicateCount, rows };
}
