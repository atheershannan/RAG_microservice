/**
 * Manual mock for grpcClient.util.js
 */

import { jest } from '@jest/globals';

export const loadProto = jest.fn();
export const createGrpcClient = jest.fn();
export const grpcCall = jest.fn();

