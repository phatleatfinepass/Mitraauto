/**
 * Paytrail API Client
 * 
 * HTTP client for calling the external Paytrail payment backend.
 * Uses the contract defined in paytrailContract.ts
 */

import {
  PAYTRAIL_CREATE_URL,
  PaytrailCreateRequest,
  PaytrailCreateResponsePayload,
  PaytrailCreateErrorPayload,
} from './paytrailContract';

const NETWORK_ERROR_RESPONSE: PaytrailCreateErrorPayload = {
  ok: false,
  error: 'network_error',
  message: 'Failed to reach payment service.',
  version: 'client_v1',
};

/**
 * Calls the Paytrail payment creation endpoint.
 * 
 * @param request - Payment creation request
 * @returns Promise resolving to the response payload
 * @throws Error on network failures or non-JSON responses
 */
export async function createPaytrailPayment(
  request: PaytrailCreateRequest
): Promise<PaytrailCreateResponsePayload> {
  console.log('🔵 Calling Paytrail API:', PAYTRAIL_CREATE_URL);
  console.log('📤 Request payload:', request);
  
  try {
    const response = await fetch(PAYTRAIL_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📥 Response status:', response.status, response.statusText);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    // If 404, the backend endpoint doesn't exist
    if (response.status === 404) {
      console.error('❌ Backend endpoint not found at:', PAYTRAIL_CREATE_URL);
      console.error('💡 The Paytrail backend may not be deployed or the URL is incorrect.');
      console.error('💡 Expected URL format: https://{project-ref}.supabase.co/functions/v1/{function-name}');
      
      return {
        ok: false,
        error: 'endpoint_not_found',
        message: 'Payment service endpoint not found. Please contact support.',
        details: {
          status: '404',
          meta: [`URL: ${PAYTRAIL_CREATE_URL}`],
        },
        version: 'client_v1',
      };
    }

    const payload = await parsePaytrailResponse(response);

    if (!response.ok && payload.ok) {
      // HTTP error but payload claims success – treat as network failure.
      return NETWORK_ERROR_RESPONSE;
    }

    if (!payload.ok) {
      console.error('Paytrail payment creation failed:', payload);
      return payload;
    }

    console.log('✅ Paytrail payment created successfully:', {
      order_id: payload.order_id,
      transaction_id: payload.transaction_id,
    });
    return payload;
  } catch (error) {
    console.error('❌ Network error calling Paytrail API:', error);
    return NETWORK_ERROR_RESPONSE;
  }
}

async function parsePaytrailResponse(
  response: Response
): Promise<PaytrailCreateResponsePayload> {
  let data: unknown;

  try {
    // Try to get the raw text first for debugging
    const text = await response.text();
    console.log('📄 Raw response:', text.substring(0, 500));
    
    // Try to parse as JSON
    data = JSON.parse(text);
  } catch (parseError) {
    console.error('❌ Failed to parse Paytrail response as JSON:', parseError);
    return {
      ...NETWORK_ERROR_RESPONSE,
      message: 'Payment service returned an invalid response. Please try again.',
    };
  }

  if (isPaytrailPayload(data)) {
    return data;
  }

  console.error('❌ Unexpected Paytrail response payload:', data);
  return {
    ...NETWORK_ERROR_RESPONSE,
    message: 'Payment service returned an unexpected response format.',
  };
}

function isPaytrailPayload(
  payload: unknown
): payload is PaytrailCreateResponsePayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'ok' in payload &&
    typeof (payload as { ok: unknown }).ok === 'boolean'
  );
}

/**
 * Helper to get the current origin for constructing return URLs.
 * Falls back to localhost in development if window is not available.
 */
export function getReturnUrlBase(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR or testing
  return (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3000';
}