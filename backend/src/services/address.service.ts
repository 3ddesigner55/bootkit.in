import { isValidObjectId } from 'mongoose';

import { HTTP_STATUS } from '../constants/httpStatus';
import Address from '../models/address.model';
import User from '../models/user.model';
import type { ApiError } from '../types/api';
import type {
  AddressInput,
  AddressUpdateInput,
} from '../validators/address.validator';

function serviceError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { statusCode });
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

  return Address.create({ ...input, user: userId, isDefault });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressUpdateInput,
) {
  await validateUser(userId);
  const address = await getUserAddress(userId, addressId);

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
