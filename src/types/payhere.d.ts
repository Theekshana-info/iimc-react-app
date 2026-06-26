// Type declarations for PayHere JavaScript SDK (payhere.js)
// Loaded globally via <script> tag in index.html

declare global {
  interface PayHerePayment {
    sandbox: boolean;
    merchant_id: string;
    return_url: string | undefined;
    cancel_url: string | undefined;
    notify_url: string;
    order_id: string;
    items: string;
    amount: string;
    currency: string;
    hash: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    custom_1?: string;
    custom_2?: string;
    recurrence?: string;
    duration?: string;
  }

  interface PayHere {
    startPayment: (payment: PayHerePayment) => void;
    onCompleted: (orderId: string) => void;
    onDismissed: () => void;
    onError: (error: string) => void;
  }

  interface Window {
    payhere: PayHere;
  }
  var payhere: PayHere;
}

export {};

