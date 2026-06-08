import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, verifyPayment } from '../lib/payments.api';
import { authStore } from '../store/auth.store';

declare global {
  interface Window {
    Razorpay: new (options: object) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export function usePayNow(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = authStore.getUser();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      await loadRazorpayScript();

      const order = await createOrder(paymentId);

      return new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: order.clubName,
          description: `Monthly due — ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][order.month - 1]} ${order.year}`,
          order_id: order.orderId,
          prefill: {
            name: user?.name ?? '',
            contact: user?.phone ?? '',
          },
          theme: { color: '#2563eb' },
          modal: {
            ondismiss: () => reject(new Error('cancelled')),
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                paymentId: order.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        rzp.open();
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard-member'] });
      qc.invalidateQueries({ queryKey: ['dashboard-admin'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      onSuccess?.();
    },
  });
}
