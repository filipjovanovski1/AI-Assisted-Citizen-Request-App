export const DEFAULT_REQUEST_IMAGE_URL = '/default_service_request_image.png';

const backendOrigin = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '');

export const resolveRequestImageUrl = (imageUrl?: string) => {
  const nextUrl = imageUrl && imageUrl.trim().length > 0 ? imageUrl.trim() : DEFAULT_REQUEST_IMAGE_URL;

  if (/^https?:\/\//i.test(nextUrl) || nextUrl.startsWith('data:')) {
    return nextUrl;
  }

  if (nextUrl.startsWith('/uploads/') && backendOrigin) {
    return `${backendOrigin}${nextUrl}`;
  }

  return nextUrl;
};
