import { toast, ToastOptions, Id } from "react-toastify";

// Type for API error response
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

// Default toast options
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Success toast
export const showSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

// Error toast
export const showError = (message: string, options?: ToastOptions) => {
  return toast.error(message, { ...defaultOptions, ...options });
};

// Warning toast
export const showWarning = (message: string, options?: ToastOptions) => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

// Info toast
export const showInfo = (message: string, options?: ToastOptions) => {
  return toast.info(message, { ...defaultOptions, ...options });
};

// Default toast
export const showToast = (message: string, options?: ToastOptions) => {
  return toast(message, { ...defaultOptions, ...options });
};

// Loading toast
export const showLoading = (
  message: string = "Đang xử lý...",
  options?: ToastOptions
) => {
  return toast.loading(message, { ...defaultOptions, ...options });
};

// Update an existing toast
export const updateToast = (
  toastId: Id,
  message: string,
  type: "success" | "error" | "warning" | "info" | "default" = "default",
  options?: ToastOptions
) => {
  const updateOptions = {
    ...defaultOptions,
    ...options,
    render: message,
    type: type,
    isLoading: false,
  };

  return toast.update(toastId, updateOptions);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Dismiss a specific toast
export const dismissToast = (toastId: Id) => {
  toast.dismiss(toastId);
};

// Promise-based toast for async operations
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    pending: string;
    success: string;
    error: string;
  },
  options?: ToastOptions
) => {
  return toast.promise(promise, messages, { ...defaultOptions, ...options });
};

// Utility to extract error message from API response
export const extractErrorMessage = (
  error: unknown,
  defaultMessage: string = "Đã xảy ra lỗi"
): string => {
  if (error && typeof error === "object") {
    const errorObj = error as ApiErrorResponse;
    if (errorObj?.response?.data?.message) {
      return errorObj.response.data.message;
    }
    if (errorObj?.response?.data?.error) {
      return errorObj.response.data.error;
    }
    if (errorObj?.message) {
      return errorObj.message;
    }
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
};

// Show error toast with automatic message extraction
export const showApiError = (
  error: unknown,
  defaultMessage?: string,
  options?: ToastOptions
) => {
  const message = extractErrorMessage(error, defaultMessage);
  return showError(message, options);
};

// Show success toast for API operations
export const showApiSuccess = (message: string, options?: ToastOptions) => {
  return showSuccess(message, options);
};

const toastUtils = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  toast: showToast,
  loading: showLoading,
  update: updateToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  promise: showPromiseToast,
  apiError: showApiError,
  apiSuccess: showApiSuccess,
  extractError: extractErrorMessage,
};

export default toastUtils;
