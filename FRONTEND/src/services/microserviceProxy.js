/**
 * Microservice Proxy Service
 * 
 * Acts as a transparent relay between user and microservices (Assessment/DevLab)
 * in Support Mode. Forwards messages verbatim without modification.
 */

import api from './api.js';
import { MODES } from '../store/slices/chatMode.slice.js';

/**
 * Generate or retrieve user session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('chatbot_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chatbot_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Forward user query to Assessment microservice
 * @param {string} userMessage - User's question/problem
 * @returns {Promise<string>} - Microservice response (verbatim)
 */
export const forwardToAssessmentMicroservice = async (userMessage) => {
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();

  try {
    // Prepare request payload
    // Note: User identity (userId, tenantId, token) is automatically added via headers by api.js interceptor
    const requestPayload = {
      query: userMessage,
      timestamp,
      session_id: sessionId,
      support_mode: 'Assessment',
    };

    // Forward to Assessment microservice
    // Note: Headers (Authorization, X-User-Id, X-Tenant-Id) are added automatically by api.js interceptor
    const response = await api.post('/api/assessment/support', requestPayload);

    // Return response verbatim (exact text from microservice)
    if (response.data && response.data.response) {
      return response.data.response; // Return verbatim response
    }
    if (response.data && typeof response.data === 'string') {
      return response.data; // If response is already a string
    }
    if (response.data && response.data.answer) {
      return response.data.answer; // If response has 'answer' field
    }

    // Fallback: return the entire response as string
    return JSON.stringify(response.data);
  } catch (error) {
    // Return error message verbatim (as if from microservice)
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
      return `Error: ${errorMessage}`;
    }
    return `Error: ${error.message || 'Failed to connect to Assessment microservice'}`;
  }
};

/**
 * Forward user query to DevLab microservice
 * @param {string} userMessage - User's question/problem
 * @returns {Promise<string>} - Microservice response (verbatim)
 */
export const forwardToDevLabMicroservice = async (userMessage) => {
  const sessionId = getSessionId();
  const timestamp = new Date().toISOString();

  try {
    // Prepare request payload
    // Note: User identity (userId, tenantId, token) is automatically added via headers by api.js interceptor
    const requestPayload = {
      query: userMessage,
      timestamp,
      session_id: sessionId,
      support_mode: 'DevLab',
    };

    // Forward to DevLab microservice
    // Note: Headers (Authorization, X-User-Id, X-Tenant-Id) are added automatically by api.js interceptor
    const response = await api.post('/api/devlab/support', requestPayload);

    // Return response verbatim (exact text from microservice)
    if (response.data && response.data.response) {
      return response.data.response; // Return verbatim response
    }
    if (response.data && typeof response.data === 'string') {
      return response.data; // If response is already a string
    }
    if (response.data && response.data.answer) {
      return response.data.answer; // If response has 'answer' field
    }

    // Fallback: return the entire response as string
    return JSON.stringify(response.data);
  } catch (error) {
    // Return error message verbatim (as if from microservice)
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || error.response.data.error || JSON.stringify(error.response.data);
      return `Error: ${errorMessage}`;
    }
    return `Error: ${error.message || 'Failed to connect to DevLab microservice'}`;
  }
};

/**
 * Proxy message to appropriate microservice based on mode
 * @param {string} userMessage - User's question/problem
 * @param {string} mode - Current chat mode (ASSESSMENT_SUPPORT or DEVLAB_SUPPORT)
 * @returns {Promise<string>} - Microservice response (verbatim)
 */
export const proxyToMicroservice = async (userMessage, mode) => {
  if (mode === MODES.ASSESSMENT_SUPPORT) {
    return await forwardToAssessmentMicroservice(userMessage);
  }
  if (mode === MODES.DEVLAB_SUPPORT) {
    return await forwardToDevLabMicroservice(userMessage);
  }
  
  // Should not reach here in Support Mode
  throw new Error('Invalid mode for proxy: must be ASSESSMENT_SUPPORT or DEVLAB_SUPPORT');
};

