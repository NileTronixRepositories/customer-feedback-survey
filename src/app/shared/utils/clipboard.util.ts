/**
 * Universal clipboard copy helper that works in:
 * - Modern browsers with Secure Context (HTTPS or localhost) via navigator.clipboard
 * - Insecure contexts (HTTP, LAN IP address) and embedded webviews via textarea + execCommand fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const normalized = text?.trim();
  if (!normalized) {
    return false;
  }

  // 1. Try modern asynchronous Clipboard API if available
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(normalized);
      return true;
    } catch {
      // Fallback to execCommand below if Clipboard API is restricted or fails
    }
  }

  // 2. Fallback using document.execCommand('copy')
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = normalized;
      // Prevent zooming / scrolling
      textArea.style.fontSize = '12pt';
      textArea.style.border = '0';
      textArea.style.padding = '0';
      textArea.style.margin = '0';
      // Move outside of the screen
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, normalized.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}
