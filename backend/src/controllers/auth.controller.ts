import type { Request, Response } from 'express';

import { HTTP_STATUS } from '../constants/httpStatus';
import {
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  sendOtp,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
} from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import type {
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  SendOtpInput,
  VerifyOtpInput,
} from '../validators/auth.validator';

export async function registerController(request: Request, response: Response) {
  const result = await registerUser(response.locals.register as RegisterInput);

  return sendSuccess(
    response,
    HTTP_STATUS.CREATED,
    result,
    'Registration successful.',
  );
}

export async function loginController(request: Request, response: Response) {
  const result = await loginUser(response.locals.login as LoginInput);

  return sendSuccess(response, HTTP_STATUS.OK, result, 'Login successful.');
}

export async function sendOtpController(request: Request, response: Response) {
  const result = await sendOtp(response.locals.sendOtp as SendOtpInput);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'OTP sent successfully.',
  );
}

export async function verifyOtpController(
  request: Request,
  response: Response,
) {
  const result = await verifyOtp(response.locals.verifyOtp as VerifyOtpInput);

  return sendSuccess(
    response,
    HTTP_STATUS.OK,
    result,
    'Phone verified successfully.',
  );
}

export async function refreshController(request: Request, response: Response) {
  const result = await refreshUserSession(
    response.locals.refreshToken as RefreshTokenInput,
  );

  return sendSuccess(response, HTTP_STATUS.OK, result, 'Session refreshed.');
}

export async function logoutController(request: Request, response: Response) {
  await logoutUser(request.user!.id);

  return sendSuccess(response, HTTP_STATUS.OK, {}, 'Logout successful.');
}

export async function forgotPasswordController(request: Request, response: Response) {
  const { email } = request.body;
  if (!email) {
    return response.status(400).json({ success: false, message: 'Email is required.' });
  }

  await requestPasswordReset(email);

  return sendSuccess(response, HTTP_STATUS.OK, {}, 'If the email is registered, reset link has been generated.');
}

export async function resetPasswordController(request: Request, response: Response) {
  const { token, password } = request.body;
  if (!token || !password) {
    return response.status(400).json({ success: false, message: 'Token and password are required.' });
  }

  await resetPassword(token, password);

  return sendSuccess(response, HTTP_STATUS.OK, {}, 'Password reset successfully.');
}
