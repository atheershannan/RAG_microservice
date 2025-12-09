/**
 * Manual mock for coordinator.client.js
 */

import { jest } from '@jest/globals';

export const resetClient = jest.fn();
export const routeRequest = jest.fn();
export const isCoordinatorAvailable = jest.fn();
export const getMetrics = jest.fn();
export const resetMetrics = jest.fn();

