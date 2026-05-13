// HIGH-5: Shared HTML sanitization utility
// All user/admin-generated HTML must pass through this before rendering
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'video', 'source',
      'iframe', 'span', 'div', 'hr', 'pre', 'code',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'class', 'style', 'target', 'rel',
      'width', 'height', 'controls', 'allow', 'allowfullscreen',
      'frameborder', 'type',
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
