import type { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '../constants/httpStatus';
import {
  createDefaultDraft,
  getDraftConfig,
  saveDraftConfig,
  removeSectionFromDraft,
  publishConfiguration,
  previewConfiguration,
  getVersionHistory,
} from '../services/adminHomeConfig.service';
import { validateSaveDraftInput } from '../validators/adminHomeConfig.validator';

export async function getDraftConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const scopeType = (req.query.scopeType as any) || 'GLOBAL';
    const scopeId = (req.query.scopeId as string) || null;

    const draft = await getDraftConfig(scopeType, scopeId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDraftConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const scopeType = (req.body.scopeType as any) || 'GLOBAL';
    const scopeId = (req.body.scopeId as string) || null;
    const userId = req.user?.id;
    const userRole = req.user?.role || 'ADMIN';

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const draft = await createDefaultDraft(userId, userRole, scopeType, scopeId);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Draft configuration created successfully.',
      data: draft,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveDraftConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const validatedInput = validateSaveDraftInput(req.body);
    const userId = req.user?.id;
    const userRole = req.user?.role || 'ADMIN';

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const updatedDraft = await saveDraftConfig(
      userId,
      userRole,
      validatedInput,
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Draft configuration saved successfully.',
      data: updatedDraft,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeSectionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const scopeType = req.body.scopeType || 'GLOBAL';
    const scopeId = req.body.scopeId || null;
    const sectionId = req.body.sectionId;
    const userId = req.user?.id;
    const userRole = req.user?.role || 'ADMIN';

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!sectionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'sectionId is required.',
      });
    }

    const updatedDraft = await removeSectionFromDraft(
      userId,
      userRole,
      scopeType,
      scopeId,
      sectionId
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Section removed successfully from draft.',
      data: updatedDraft,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'ADMIN';
    const scopeType = req.body.scopeType || 'GLOBAL';
    const scopeId = req.body.scopeId || null;

    if (!userId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const result = await publishConfiguration(
      userId,
      userRole,
      scopeType,
      scopeId,
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Configuration version ${result.published.configVersion} published successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function previewConfigHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const scopeType = (req.query.scopeType as any) || 'GLOBAL';
    const scopeId = (req.query.scopeId as string) || null;
    const storeId = req.query.storeId as string | undefined;

    const preview = await previewConfiguration(scopeType, scopeId, storeId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preview,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const scopeType = (req.query.scopeType as any) || 'GLOBAL';
    const scopeId = (req.query.scopeId as string) || null;

    const history = await getVersionHistory(scopeType, scopeId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
}
