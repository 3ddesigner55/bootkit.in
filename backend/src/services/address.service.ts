import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Address from '../models/address.model';
import User from '../models/user.model';
import DeliveryArea from '../models/deliveryArea.model';
import type { ApiError } from '../types/api';
import type {
  AddressInput,
  AddressUpdateInput,
} from '../validators/address.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
}

async function validatePostalCodeServiceability(postalCode: string): Promise<void> {
  const area = await DeliveryArea.findOne({
    pincode: postalCode,
    active: true,
    deletedAt: null,
  }).populate('store');

  if (!area || !area.store) {
    throw serviceError('Delivery unserviceable for this pincode.', HTTP_STATUS.BAD_REQUEST);
  }

  const store = area.store as any;
  if (!store.active || store.deletedAt) {
    throw serviceError('Delivery unserviceable for this pincode.', HTTP_STATUS.BAD_REQUEST);
  }
}

async function validateUser(userId: string): Promise<void> {
  const user = await User.exists({
    _id: userId,
    isActive: true,
    deletedAt: null,
  });

  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }
}

function getAddressId(addressId: string): string {
  if (!isValidObjectId(addressId)) {
    throw serviceError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  return addressId;
}

async function getUserAddress(userId: string, addressId: string) {
  const address = await Address.findOne({
    _id: getAddressId(addressId),
    user: userId,
    deletedAt: null,
  });

  if (!address) {
    throw serviceError('Address not found.', HTTP_STATUS.NOT_FOUND);
  }

  return address;
}

export async function getAddresses(userId: string) {
  await validateUser(userId);

  return Address.find({ user: userId, deletedAt: null })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
}

export async function getAddressById(userId: string, addressId: string) {
  await validateUser(userId);
  const address = await getUserAddress(userId, addressId);

  return address.toObject();
}

export async function createAddress(userId: string, input: AddressInput) {
  await validateUser(userId);

  // 1. Verify postalCode against delivery areas
  await validatePostalCodeServiceability(input.postalCode);

  // 2. recipientType logic
  const user = await User.findById(userId);
  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const recipientType = input.recipientType || 'MYSELF';
  let fullName = input.fullName;
  let phone = input.phone;

  if (recipientType === 'MYSELF') {
    phone = user.phone;
    fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
  } else {
    if (!fullName || !phone) {
      throw serviceError('fullName and phone are required for SOMEONE_ELSE.', HTTP_STATUS.BAD_REQUEST);
    }
  }

  const hasExistingAddress = await Address.exists({
    user: userId,
    deletedAt: null,
  });
  const isDefault = !hasExistingAddress || input.isDefault === true;

  if (isDefault) {
    await Address.updateMany(
      { user: userId, deletedAt: null },
      { isDefault: false },
    );
  }

  return Address.create({
    ...input,
    fullName,
    phone,
    recipientType,
    user: userId,
    isDefault,
  });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressUpdateInput,
) {
  await validateUser(userId);
  const address = await getUserAddress(userId, addressId);

  // 1. Verify postalCode if updated
  if (input.postalCode !== undefined) {
    await validatePostalCodeServiceability(input.postalCode);
  }

  // 2. recipientType logic
  const user = await User.findById(userId);
  if (!user) {
    throw serviceError('User not found.', HTTP_STATUS.NOT_FOUND);
  }

  const recipientType = input.recipientType !== undefined ? input.recipientType : address.recipientType;

  if (address.recipientType === 'MYSELF' && input.recipientType === 'SOMEONE_ELSE') {
    if (!input.fullName || !input.phone) {
      throw serviceError(
        'fullName and phone are required when changing recipientType to SOMEONE_ELSE.',
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  if (recipientType === 'MYSELF') {
    input.phone = user.phone;
    input.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
  } else {
    const phone = input.phone !== undefined ? input.phone : address.phone;
    const fullName = input.fullName !== undefined ? input.fullName : address.fullName;
    if (!phone || !fullName) {
      throw serviceError('fullName and phone are required for SOMEONE_ELSE.', HTTP_STATUS.BAD_REQUEST);
    }
  }

  Object.assign(address, input);
  await address.save();

  return address;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  await validateUser(userId);
  const address = await getUserAddress(userId, addressId);

  if (!address.isDefault) {
    await Address.updateMany(
      { user: userId, deletedAt: null },
      { isDefault: false },
    );
    address.isDefault = true;
    await address.save();
  }

  return address;
}

export async function deleteAddress(userId: string, addressId: string) {
  await validateUser(userId);
  const address = await getUserAddress(userId, addressId);
  const wasDefault = address.isDefault;

  address.isDefault = false;
  address.deletedAt = new Date();
  address.deletedBy = userId;
  await address.save();

  if (wasDefault) {
    const replacement = await Address.findOne({
      user: userId,
      deletedAt: null,
    }).sort({ createdAt: -1 });

    if (replacement) {
      replacement.isDefault = true;
      await replacement.save();
    }
  }

  return address;
}
