/**
 * Normalisation of errors thrown by `fetchClient` so every API service surfaces
 * the same `{ message, code, status }` shape to the components consuming it.
 *
 * Usage:
 *   import { handleApiError } from '../utils/apiError';
 *   try { ... } catch (error) { handleApiError(error); }
 */

export const extractApiError = (error) => ({
  message: error.response?.data?.error || error.message || 'An error occurred',
  code: error.response?.data?.code || 'UNKNOWN_ERROR',
  status: error.response?.status
});

/** Rethrow a fetchClient error as a plain `{ message, code, status }` object. */
export const handleApiError = (error) => {
  throw extractApiError(error);
};

/** Rethrow a fetchClient error as an `Error` carrying `code` and `status`. */
export const handleApiErrorAsError = (error) => {
  const { message, code, status } = extractApiError(error);
  const err = new Error(message);
  err.code = code;
  err.status = status;
  throw err;
};
