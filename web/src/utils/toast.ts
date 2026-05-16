import type { MessageInstance } from 'antd/es/message/interface';

let _message: MessageInstance | null = null;

export const initToast = (api: MessageInstance) => {
  _message = api;
};

const get = () => {
  if (!_message) {
    // Fallback: import static message — theme won't apply but at least it won't crash
    import('antd').then(({ message }) => {
      _message = message;
    });
  }
  return _message;
};

export const toast = {
  success: (content: string) => get()?.success(content),
  error: (content: string) => get()?.error(content),
  warning: (content: string) => get()?.warning(content),
  info: (content: string) => get()?.info(content),
};

/**
 * Extracts the error message sent by the API (response.data.message) from an
 * axios error, falling back to `fallback` when no server message is present.
 */
export const getApiError = (err: unknown, fallback: string): string => {
  if (err !== null && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (typeof resp?.data?.message === 'string' && resp.data.message.length > 0) {
      return resp.data.message;
    }
  }
  return fallback;
};
