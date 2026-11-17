/**
 * Opening a link, in the web preview. A web address opens in a new tab (false if the browser
 * blocked it). Anything else (tel:, mailto:) cannot be known to work in a browser, so it answers
 * false and the page shows the address itself.
 */
export async function openLink(url: string): Promise<boolean> {
  if (!/^https?:\/\//.test(url) || typeof window === 'undefined') return false;
  const opened = window.open(url, '_blank');
  if (!opened) return false;
  opened.opener = null; // the new tab cannot reach back into this one
  return true;
}
