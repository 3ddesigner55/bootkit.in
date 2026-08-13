/* eslint-disable @typescript-eslint/no-explicit-any */
import { HTTP_STATUS } from '../constants/httpStatus';
import Category from '../models/category.model';
import Brand from '../models/brand.model';
import Product from '../models/product.model';
import { validateProductCreate } from '../validators/product.validator';

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

function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }
  const clean = value.trim().toLowerCase();
  if (['true', 'yes', '1', 'y'].includes(clean)) {
    return true;
  }
  if (['false', 'no', '0', 'n'].includes(clean)) {
    return false;
  }
  return defaultValue;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function parseAndValidateCsv(
  buffer: Buffer,
): Promise<CsvImportResult> {
  const csvText = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length === 0) {
    throw Object.assign(new Error('CSV file is empty.'), {
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const headers = parsedRows[0].map((h) => h.trim().toLowerCase());
  const requiredHeaders = [
    'name',
    'sku',
    'category',
    'sellingprice',
    'stock',
    'unit',
  ];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    throw Object.assign(
      new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`),
      { statusCode: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const rows: CsvRowPreview[] = [];
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (let i = 1; i < parsedRows.length; i++) {
    const rowData = parsedRows[i];
    const errors: string[] = [];
    const rawRecord: Record<string, string> = {};

    headers.forEach((header, index) => {
      rawRecord[header] = rowData[index] || '';
    });

    const getField = (name: string): string => {
      const idx = headers.indexOf(name.toLowerCase());
      return idx !== -1 && rowData[idx] !== undefined
        ? rowData[idx].trim()
        : '';
    };

    const name = getField('name');
    const sku = getField('sku');
    const categoryVal = getField('category');
    const brandVal = getField('brand');
    const sellingPriceVal = getField('sellingPrice');
    const mrpVal = getField('mrp');
    const stockVal = getField('stock');
    const unitVal = getField('unit');
    const deliveryMinutesVal = getField('deliveryMinutes');

    if (!name) {
      errors.push('Product name is required.');
    }
    if (!sku) {
      errors.push('SKU is required.');
    }
    if (!categoryVal) {
      errors.push('Category is required.');
    }
    if (!sellingPriceVal) {
      errors.push('Selling price is required.');
    }
    if (!stockVal) {
      errors.push('Stock is required.');
    }
    if (!unitVal) {
      errors.push('Unit is required.');
    }

    let categoryId = '';
    if (categoryVal) {
      const categoryDoc = await Category.findOne({
        $or: [
          { slug: categoryVal.toLowerCase() },
          { name: new RegExp(`^${categoryVal}$`, 'i') },
        ],
        deletedAt: null,
      }).lean();
      if (!categoryDoc) {
        errors.push(`Category "${categoryVal}" not found.`);
      } else {
        categoryId = categoryDoc._id.toString();
      }
    }

    let brandId = '';
    if (brandVal) {
      const brandDoc = await Brand.findOne({
        $or: [
          { slug: brandVal.toLowerCase() },
          { name: new RegExp(`^${brandVal}$`, 'i') },
        ],
        deletedAt: null,
      }).lean();
      if (!brandDoc) {
        errors.push(`Brand "${brandVal}" not found.`);
      } else {
        brandId = brandDoc._id.toString();
      }
    }

    let doubleSkuInCsv = false;
    if (sku) {
      if (seenSkus.has(sku.toUpperCase())) {
        errors.push('Duplicate SKU in CSV.');
        doubleSkuInCsv = true;
      } else {
        seenSkus.add(sku.toUpperCase());
      }
    }

    let isDuplicateDb = false;
    if (sku && !doubleSkuInCsv) {
      const productDoc = await Product.findOne({
        sku: new RegExp(`^${sku}$`, 'i'),
        deletedAt: null,
      }).lean();
      if (productDoc) {
        isDuplicateDb = true;
      }
    }

    const slug = getField('slug') || createSlug(name);
    const normalizedSlug = slug.trim().toLowerCase();
    let doubleSlugInCsv = false;
    if (normalizedSlug) {
      if (seenSlugs.has(normalizedSlug)) {
        errors.push('Duplicate slug in CSV.');
        doubleSlugInCsv = true;
      } else {
        seenSlugs.add(normalizedSlug);
      }
    }

    if (normalizedSlug && !doubleSlugInCsv) {
      const productWithSlug = await Product.findOne({
        slug: normalizedSlug,
        deletedAt: null,
      }).lean();

      if (productWithSlug) {
        if (productWithSlug.sku.toUpperCase() !== sku.toUpperCase()) {
          errors.push(
            `Slug "${normalizedSlug}" collides with an existing product (SKU: ${productWithSlug.sku}) in database.`,
          );
        }
      }
    }

    const mrp = mrpVal ? Number(mrpVal) : undefined;
    const sellingPrice = sellingPriceVal ? Number(sellingPriceVal) : NaN;
    const stock = stockVal ? Number(stockVal) : NaN;
    const deliveryMinutes = deliveryMinutesVal
      ? Number(deliveryMinutesVal)
      : undefined;

    if (mrpVal && (isNaN(mrp as number) || (mrp as number) < 0)) {
      errors.push('MRP must be a valid non-negative number.');
    }
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push('Selling price must be a valid non-negative number.');
    }
    if (
      mrpVal &&
      !isNaN(sellingPrice) &&
      !isNaN(mrp as number) &&
      sellingPrice > (mrp as number)
    ) {
      errors.push('Selling price cannot be greater than MRP.');
    }
    if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
      errors.push('Stock must be a valid non-negative integer.');
    }
    if (
      deliveryMinutesVal &&
      (isNaN(deliveryMinutes as number) ||
        !Number.isInteger(deliveryMinutes as number) ||
        (deliveryMinutes as number) < 1)
    ) {
      errors.push('Delivery minutes must be a positive integer.');
    }

    const galleryVal = getField('gallery');
    const gallery = galleryVal
      ? galleryVal
          .split('|')
          .map((g) => g.trim())
          .filter(Boolean)
      : [];

    const highlightsVal = getField('highlights');
    const highlights = highlightsVal
      ? highlightsVal
          .split('|')
          .map((h) => h.trim())
          .filter(Boolean)
      : [];

    const attributesVal = getField('attributes');
    const attributes: { label: string; value: string }[] = [];
    if (attributesVal) {
      attributesVal.split('|').forEach((item) => {
        const split = item.split('::');
        if (split.length === 2 && split[0].trim() && split[1].trim()) {
          attributes.push({
            label: split[0].trim(),
            value: split[1].trim(),
          });
        }
      });
    }

    const payload = {
      name,
      slug: normalizedSlug,
      sku,
      barcode: getField('barcode') || undefined,
      category: categoryId || 'dummy_id_to_pass_validation',
      brand: brandId || undefined,
      description: getField('description') || '',
      mrp: !isNaN(mrp as number) ? mrp : undefined,
      sellingPrice: !isNaN(sellingPrice) ? sellingPrice : 0,
      stock: !isNaN(stock) ? stock : 0,
      unit: unitVal,
      deliveryMinutes: !isNaN(deliveryMinutes as number)
        ? deliveryMinutes
        : undefined,
      thumbnail: getField('thumbnail') || undefined,
      gallery,
      videoUrl: getField('videoUrl') || undefined,
      active: parseBoolean(getField('active') || undefined, true),
      featured: parseBoolean(getField('featured') || undefined, false),
      bestseller: parseBoolean(getField('bestseller') || undefined, false),
      attributes,
      highlights,
      ingredients: getField('ingredients') || undefined,
      storageInstructions: getField('storageInstructions') || undefined,
      usageInstructions: getField('usageInstructions') || undefined,
      replacementPolicy: getField('replacementPolicy') || undefined,
    };

    if (errors.length === 0) {
      try {
        validateProductCreate(payload);
      } catch (err: any) {
        errors.push(err.message || 'Validation failed.');
      }
    }

    const status =
      errors.length > 0 ? 'invalid' : isDuplicateDb ? 'duplicate' : 'valid';

    // Replace category dummy ID in the response preview payload
    if (payload.category === 'dummy_id_to_pass_validation') {
      payload.category = '';
    }

    rows.push({
      index: i,
      status,
      errors,
      raw: rawRecord,
      ...(status !== 'invalid' ? { data: payload } : {}),
    });
  }

  const validCount = rows.filter((r) => r.status === 'valid').length;
  const invalidCount = rows.filter((r) => r.status === 'invalid').length;
  const duplicateCount = rows.filter((r) => r.status === 'duplicate').length;

  return {
    totalRows: parsedRows.length - 1,
    validCount,
    invalidCount,
    duplicateCount,
    rows,
  };
}

export async function executeConfirmImport(
  products: any[],
  action: 'skip' | 'update',
  userId: string,
): Promise<{ importedCount: number }> {
  let importedCount = 0;

  for (const product of products) {
    const existing = await Product.findOne({
      sku: new RegExp(`^${product.sku}$`, 'i'),
      deletedAt: null,
    });

    if (existing) {
      if (action === 'update') {
        await Product.updateOne(
          { _id: existing._id },
          { ...product, updatedBy: userId },
        );
        importedCount++;
      }
    } else {
      await Product.create({
        ...product,
        createdBy: userId,
        updatedBy: userId,
      });
      importedCount++;
    }
  }

  return { importedCount };
}
