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
  isPaytrailCreateSuccess,
} from './paytrailContract';

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
  try {
    const response = await fetch(PAYTRAIL_CREATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    // Try to parse JSON response
    let data: PaytrailCreateResponsePayload;
    try {
      data = await response.json();
    } catch (parseError) {
      // Non-JSON response - likely a network/server error
      console.error('Failed to parse Paytrail response:', parseError);
      throw new Error(`Failed to parse response from payment service (HTTP ${response.status})`);
    }

    // Check if we got a success or error payload
    if (isPaytrailCreateSuccess(data)) {
      console.log('Paytrail payment created successfully:', {
        order_id: data.order_id,
        transaction_id: data.transaction_id,
      });
      return data;
    } else {
      // Backend returned a structured error
      console.error('Paytrail payment creation failed:', data);
      return data;
    }
  } catch (error) {
    console.error('Network error calling Paytrail API:', error);
    
    // Return a structured error for network failures
    return {
      ok: false,
      error: 'network_error',
      message: error instanceof Error 
        ? error.message 
        : 'Network error connecting to payment service',
    };
  }
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
