/**
 * Manual mock for communicationManager.service.js
 */

import { jest } from '@jest/globals';

export const shouldCallCoordinator = jest.fn();
export const callCoordinatorRoute = jest.fn();
export const processCoordinatorResponse = jest.fn();

