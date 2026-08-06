import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

import swaggerSpec from '../config/swagger';

export const docsRoutes = Router();

docsRoutes.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
