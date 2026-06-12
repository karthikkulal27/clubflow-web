type ToastType = 'success' | 'error';

function dispatch(type: ToastType, message: string) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { type, message } }));
}

export const toast = {
  success: (message: string) => dispatch('success', message),
  error: (message: string) => dispatch('error', message),
};
