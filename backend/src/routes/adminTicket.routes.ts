import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { ROLES } from '../constants/roles';
import { asyncHandler } from '../utils/asyncHandler';
import { HTTP_STATUS } from '../constants/httpStatus';
import Ticket from '../models/ticket.model';
import Order from '../models/order.model';
import User from '../models/user.model';
import { sendSuccess } from '../utils/apiResponse';

export const adminTicketRoutes = Router();

adminTicketRoutes.use(authenticate, authorizeRoles(ROLES.ADMIN, ROLES.OWNER));

// GET /api/admin/support/tickets - list tickets
adminTicketRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const type = req.query.type as string;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const tickets = await Ticket.find(filter)
      .populate('order', 'orderNumber')
      .populate('customer', 'firstName lastName phone')
      .populate('store', 'name')
      .populate('assignedStaff', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, tickets, 'Tickets retrieved successfully.');
  }),
);

// GET /api/admin/support/tickets/:ticketId - get single ticket details
adminTicketRoutes.get(
  '/:ticketId',
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('order')
      .populate('customer', 'firstName lastName email phone')
      .populate('store', 'name city state')
      .populate('assignedStaff', 'firstName lastName email')
      .populate('affectedItems.product', 'name sku thumbnail')
      .lean();

    if (!ticket) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    return sendSuccess(res, HTTP_STATUS.OK, ticket, 'Ticket retrieved successfully.');
  }),
);

// PATCH /api/admin/support/tickets/:ticketId - update status, priority, or assign staff
adminTicketRoutes.patch(
  '/:ticketId',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, assignedStaffId, resolution } = req.body;

    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Ticket not found.',
      });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (resolution) ticket.resolution = resolution;

    if (assignedStaffId !== undefined) {
      if (assignedStaffId) {
        if (!mongoose.isValidObjectId(assignedStaffId)) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Invalid staff ID.',
          });
        }
        const staff = await User.findById(assignedStaffId);
        if (!staff) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Assigned staff not found.',
          });
        }
        ticket.assignedStaff = staff._id;
      } else {
        ticket.assignedStaff = null;
      }
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = new mongoose.Types.ObjectId(req.user!.id);
    }

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate('order', 'orderNumber')
      .populate('customer', 'firstName lastName phone')
      .populate('store', 'name')
      .populate('assignedStaff', 'firstName lastName')
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, populated, 'Ticket updated successfully.');
  }),
);
