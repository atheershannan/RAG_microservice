/**
 * Recommendations Routes
 * REST API routes for personalized recommendations
 */

import express from 'express';
import { getRecommendations } from '../controllers/recommendations.controller.js';

const router = express.Router();

/**
 * GET /api/v1/personalized/recommendations/:userId
 * Get personalized recommendations for a user
 */
router.get('/personalized/recommendations/:userId', getRecommendations);

export default router;

