/**
 * Payment Processor Types
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  recipientId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentError {
  code: string;
  message: string;
  type:
    | 'payment_method_failed'
    | 'insufficient_funds'
    | 'network_error'
    | 'rate_limit'
    | 'invalid_request'
    | 'unknown';
  retryable: boolean;
  details?: unknown;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: PaymentError;
  metadata?: Record<string, unknown>;
}

export interface PaymentProcessor {
  getName(): string;
  isConfigured(): boolean;
  validatePaymentMethod(identifier: string): Promise<boolean>;
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
}
