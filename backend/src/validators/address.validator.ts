import type { NextFunction, Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import type { ApiError } from '../types/api';

export type AddressInput = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  deliveryInstructions?: string;
  isDefault?: boolean;
  recipientType?: 'MYSELF' | 'SOMEONE_ELSE';
  googleMapsLink?: string;
};

export type AddressUpdateInput = Omit<Partial<AddressInput>, 'isDefault'>;

function validationError(message: string): ApiError {
  return Object.assign(new Error(message), {
    statusCode: HTTP_STATUS.BAD_REQUEST,
  });
}

function getObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw validationError('Request body must be an object.');
  }

  return input as Record<string, unknown>;
}

function sanitizeString(val: string): string {
  const noTags = val.replace(/<[^>]*>/g, '');
  return noTags.replace(/\s+/g, ' ').trim();
}

function getRequiredString(
  input: Record<string, unknown>,
  field:
    | 'label'
    | 'fullName'
    | 'phone'
    | 'addressLine1'
    | 'city'
    | 'state'
    | 'country'
    | 'postalCode',
): string {
  const value = input[field];

  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} is required.`);
  }

  const sanitized = sanitizeString(value);
  if (!sanitized) {
    throw validationError(`${field} cannot be empty after HTML sanitization.`);
  }

  return sanitized;
}

function getOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return sanitizeString(value);
}

function getRequiredUpdateString(
  input: Record<string, unknown>,
  field: string,
  maxLength?: number,
): string | undefined {
  if (!(field in input)) {
    return undefined;
  }
  const value = input[field];
  if (value === undefined || value === null) {
    throw validationError(`${field} cannot be null or undefined.`);
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw validationError(`${field} cannot be empty.`);
  }
  const sanitized = sanitizeString(value);
  if (!sanitized) {
    throw validationError(`${field} cannot be empty after HTML sanitization.`);
  }
  if (maxLength && sanitized.length > maxLength) {
    throw validationError(`${field} length cannot exceed ${maxLength} characters.`);
  }
  return sanitized;
}

function getOptionalNumber(
  input: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`${field} must be a valid number.`);
  }

  return value;
}

function getOptionalBoolean(
  input: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw validationError(`${field} must be a boolean.`);
  }

  return value;
}

function validatePhone(phone: string): string {
  if (!/^\+?\d{10,15}$/.test(phone)) {
    throw validationError('Phone must be a valid 10-15 digit number.');
  }
  return phone;
}

function validatePostalCode(pincode: string): string {
  if (!/^\d{6}$/.test(pincode)) {
    throw validationError('postalCode must be a valid 6-digit number.');
  }
  return pincode;
}

function getOptionalFields(
  input: Record<string, unknown>,
): Omit<
  AddressInput,
  | 'label'
  | 'fullName'
  | 'phone'
  | 'addressLine1'
  | 'city'
  | 'state'
  | 'country'
  | 'postalCode'
  | 'recipientType'
> {
  const addressLine2 = getOptionalString(input, 'addressLine2');
  const landmark = getOptionalString(input, 'landmark');
  const latitude = getOptionalNumber(input, 'latitude');
  const longitude = getOptionalNumber(input, 'longitude');
  const deliveryInstructions = getOptionalString(input, 'deliveryInstructions');
  const isDefault = getOptionalBoolean(input, 'isDefault');
  const googleMapsLink = getOptionalString(input, 'googleMapsLink');

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
    throw validationError('latitude must be between -90 and 90.');
  }
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
    throw validationError('longitude must be between -180 and 180.');
  }

  if (googleMapsLink !== undefined && googleMapsLink !== '') {
    if (!googleMapsLink.startsWith('https://')) {
      throw validationError('googleMapsLink must be a secure HTTPS URL.');
    }
    if (googleMapsLink.length > 1000) {
      throw validationError('googleMapsLink length cannot exceed 1000 characters.');
    }
    let url: URL;
    try {
      url = new URL(googleMapsLink);
    } catch (e) {
      throw validationError('googleMapsLink is a malformed URL.');
    }

    const allowedHosts = [
      'maps.google.com',
      'google.com',
      'www.google.com',
      'goo.gl',
      'maps.app.goo.gl'
    ];
    const isHostAllowed = allowedHosts.some(h =>
      url.hostname === h || url.hostname.endsWith('.' + h)
    );
    if (!isHostAllowed) {
      throw validationError('googleMapsLink must be an approved Google Maps host.');
    }
  }

  return {
    ...(addressLine2 !== undefined ? { addressLine2 } : {}),
    ...(landmark !== undefined ? { landmark } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(deliveryInstructions !== undefined ? { deliveryInstructions } : {}),
    ...(isDefault !== undefined ? { isDefault } : {}),
    ...(googleMapsLink !== undefined ? { googleMapsLink } : {}),
  };
}

export function validateAddressCreate(input: unknown): AddressInput {
  const body = getObject(input);

  const recipientType = body.recipientType !== undefined ? body.recipientType : 'MYSELF';
  if (recipientType !== 'MYSELF' && recipientType !== 'SOMEONE_ELSE') {
    throw validationError('recipientType must be either "MYSELF" or "SOMEONE_ELSE".');
  }

  let fullName = '';
  let phone = '';

  if (recipientType === 'SOMEONE_ELSE') {
    fullName = getRequiredString(body, 'fullName');
    if (fullName.length > 100) throw validationError('fullName length cannot exceed 100 characters.');
    phone = validatePhone(getRequiredString(body, 'phone'));
  } else {
    const optFullName = getOptionalString(body, 'fullName');
    fullName = optFullName || '';
    const optPhone = getOptionalString(body, 'phone');
    phone = optPhone || '';
  }

  const label = getRequiredString(body, 'label');
  if (label.length > 50) throw validationError('label length cannot exceed 50 characters.');

  const addressLine1 = getRequiredString(body, 'addressLine1');
  if (addressLine1.length > 200) throw validationError('addressLine1 length cannot exceed 200 characters.');

  const addressLine2 = getOptionalString(body, 'addressLine2');
  if (addressLine2 && addressLine2.length > 200) {
    throw validationError('addressLine2 length cannot exceed 200 characters.');
  }

  const postalCode = validatePostalCode(getRequiredString(body, 'postalCode'));
  const city = getRequiredString(body, 'city');
  if (city.length > 100) throw validationError('city length cannot exceed 100 characters.');

  const state = getRequiredString(body, 'state');
  if (state.length > 100) throw validationError('state length cannot exceed 100 characters.');

  const country = getRequiredString(body, 'country');
  if (country.length > 100) throw validationError('country length cannot exceed 100 characters.');

  const optionalFields = getOptionalFields(body);

  return {
    label,
    fullName,
    phone,
    addressLine1,
    city,
    state,
    country,
    postalCode,
    ...optionalFields,
    recipientType: recipientType as 'MYSELF' | 'SOMEONE_ELSE',
  };
}

export function validateAddressUpdate(input: unknown): AddressUpdateInput {
  const body = getObject(input);

  if ('isDefault' in body) {
    throw validationError(
      'Use the default address endpoint to update isDefault.',
    );
  }

  const updates: Partial<AddressInput> = {};

  if ('recipientType' in body) {
    const recipientType = body.recipientType;
    if (recipientType !== 'MYSELF' && recipientType !== 'SOMEONE_ELSE') {
      throw validationError('recipientType must be either "MYSELF" or "SOMEONE_ELSE".');
    }
    updates.recipientType = recipientType as 'MYSELF' | 'SOMEONE_ELSE';
  }

  const label = getRequiredUpdateString(body, 'label', 50);
  if (label !== undefined) updates.label = label;

  const addressLine1 = getRequiredUpdateString(body, 'addressLine1', 200);
  if (addressLine1 !== undefined) updates.addressLine1 = addressLine1;

  const city = getRequiredUpdateString(body, 'city', 100);
  if (city !== undefined) updates.city = city;

  const state = getRequiredUpdateString(body, 'state', 100);
  if (state !== undefined) updates.state = state;

  const country = getRequiredUpdateString(body, 'country', 100);
  if (country !== undefined) updates.country = country;

  if ('postalCode' in body) {
    const postalCode = getRequiredUpdateString(body, 'postalCode');
    if (postalCode !== undefined) {
      updates.postalCode = validatePostalCode(postalCode);
    }
  }

  if ('phone' in body) {
    const phone = getRequiredUpdateString(body, 'phone');
    if (phone !== undefined) {
      updates.phone = validatePhone(phone);
    }
  }

  if ('fullName' in body) {
    const fullName = getRequiredUpdateString(body, 'fullName', 100);
    if (fullName !== undefined) {
      updates.fullName = fullName;
    }
  }

  if ('addressLine2' in body) {
    const addressLine2 = getOptionalString(body, 'addressLine2');
    if (addressLine2 !== undefined) {
      if (addressLine2.length > 200) {
        throw validationError('addressLine2 length cannot exceed 200 characters.');
      }
      updates.addressLine2 = addressLine2;
    }
  }

  const optionalFields = getOptionalFields(body);

  return {
    ...updates,
    ...optionalFields,
  };
}

export function validateAddressCreateRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.addressCreate = validateAddressCreate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}

export function validateAddressUpdateRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    response.locals.addressUpdate = validateAddressUpdate(request.body);
    next();
  } catch (error) {
    next(error);
  }
}
