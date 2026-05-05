// Type declarations for PayHere JavaScript SDK (payhere.js)
// Loaded globally via <script> tag in index.html

interface PayHerePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url: undefined;
  cancel_url: undefined;
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
}

interface PayHere {
  startPayment: (payment: PayHerePayment) => void;
  onCompleted: (orderId: string) => void;
  onDismissed: () => void;
  onError: (error: string) => void;
}

declare global {
  interface Window {
    payhere: PayHere;
  }
  var payhere: PayHere;
}

export {};
