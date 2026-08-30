import { API_BASE } from './client';

export type ExportFormat = 'excel' | 'pdf';

const SPEC: Record<ExportFormat, { path: string; ext: string; label: string }> = {
  excel: { path: '/api/export/excel', ext: 'xlsx', label: 'Excel workbook' },
  pdf: { path: '/api/export/pdf', ext: 'pdf', label: 'PDF report' },
};

/** Pull the server-provided filename out of Content-Disposition, if present. */
function filenameFromHeader(header: string | null): string | null {
  if (!header) return null;
  // RFC 5987 (filename*=UTF-8''...) takes precedence over the plain form.
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      /* fall through to the plain form */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() ?? null;
}

/**
 * Downloads an export as a blob and saves it via a temporary anchor.
 *
 * Uses fetch + blob rather than window.open so the request carries normal
 * headers, failures surface as real errors instead of a blank tab, and popup
 * blockers cannot silently kill the download.
 */
export async function downloadExport(format: ExportFormat, signal?: AbortSignal): Promise<string> {
  const { path, ext } = SPEC[format];

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { Accept: 'application/octet-stream' },
    signal,
  });

  if (!res.ok) {
    // Error bodies are small JSON/text; surface something actionable.
    let detail = '';
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      /* body already consumed or unreadable */
    }
    throw new Error(
      detail || `Export failed (${res.status} ${res.statusText || 'error'})`
    );
  }

  const blob = await res.blob();
  if (blob.size === 0) throw new Error('The server returned an empty file.');

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename =
    filenameFromHeader(res.headers.get('Content-Disposition')) ??
    `meridian-${format}-${stamp}.${ext}`;

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    // Revoke on the next tick so the browser has started the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return filename;
}

export const exportLabel = (format: ExportFormat) => SPEC[format].label;
