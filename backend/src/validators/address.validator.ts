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

  return value.trim();
}

function getOptionalString(
  input: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = input[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`);
  }

  return value.trim();
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
> {
  const addressLine2 = getOptionalString(input, 'addressLine2');
  const landmark = getOptionalString(input, 'landmark');
  const latitude = getOptionalNumber(input, 'latitude');
  const longitude = getOptionalNumber(input, 'longitude');
  const deliveryInstructions = getOptionalString(input, 'deliveryInstructions');
  const isDefault = getOptionalBoolean(input, 'isDefault');

  return {
    ...(addressLine2 !== undefined ? { addressLine2 } : {}),
    ...(landmark !== undefined ? { landmark } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(deliveryInstructions !== undefined ? { deliveryInstructions } : {}),
    ...(isDefault !== undefined ? { isDefault } : {}),
  };
}

export function validateAddressCreate(input: unknown): AddressInput {
  const body = getObject(input);

  return {
    label: getRequiredString(body, 'label'),
    fullName: getRequiredString(body, 'fullName'),
    phone: getRequiredString(body, 'phone'),
    addressLine1: getRequiredString(body, 'addressLine1'),
    city: getRequiredString(body, 'city'),
    state: getRequiredString(body, 'state'),
    country: getRequiredString(body, 'country'),
    postalCode: getRequiredString(body, 'postalCode'),
    ...getOptionalFields(body),
  };
}

export function validateAddressUpdate(input: unknown): AddressUpdateInput {
  const body = getObject(input);

  if ('isDefault' in body) {
    throw validationError(
      'Use the default address endpoint to update isDefault.',
    );
  }

  const fields = [
    'label',
    'fullName',
    'phone',
    'addressLine1',
    'city',
    'state',
    'country',
    'postalCode',
  ] as const;
  const requiredUpdates = Object.fromEntries(
    fields.flatMap((field) => {
      const value = getOptionalString(body, field);

      if (value !== undefined && !value) {
        throw validationError(`${field} cannot be empty.`);
      }

      return value !== undefined ? [[field, value]] : [];
    }),
  ) as Partial<Pick<AddressInput, (typeof fields)[number]>>;
  const optionalFields = getOptionalFields(body);

  return {
    ...requiredUpdates,
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
