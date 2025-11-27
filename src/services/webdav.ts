// Lightweight WebDAV client for browser extension
// Usage: import { WebDAV } from './services/webdav';
export type WebDAVConfig = {
  url: string; // e.g. "https://webdav.example.com"
  username?: string;
  password?: string;
  token?: string; // bearer token
  root?: string; // optional root path on server e.g. "backups"
};

function joinUrl(...parts: Array<string|undefined>) {
  return parts
    .filter(Boolean)
    .map(p => (p || '').replace(/(^\/+|\/+$/g, '')))
    .join('/')
    .replace(/([^:]\/)\/+/g, '$1'); // collapse double slashes except after :/
}

function getAuthHeader(cfg: WebDAVConfig): Record<string,string> {
  if (cfg.token) return { Authorization: `Bearer ${cfg.token}` };
  if (cfg.username !== undefined && cfg.password !== undefined) {
    return { Authorization: `Basic ${btoa(`${cfg.username}:${cfg.password}`)}` };
  }
  return {};
}

export class WebDAV {
  cfg: WebDAVConfig;
  constructor(cfg: WebDAVConfig) {
    this.cfg = cfg;
  }

  private absolutePath(path = '') {
    const base = this.cfg.url.replace(/\/+/g, '');
    const root = this.cfg.root || '';
    const full = joinUrl(base, root, path);
    // Ensure protocol present
    return full.startsWith('http') ? full : `https://${full}`;
  }

  private headers(additional: Record<string,string> = {}) {
    return {
      ...getAuthHeader(this.cfg),
      ...additional,
    };
  }

  // Test connection - do a PROPFIND on root (depth 0)
  async testConnection(): Promise<boolean> {
    const url = this.absolutePath('/');
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: this.headers({ Depth: '0', 'Content-Type': 'application/xml' }),
    });
    return res.ok;
  }

  // Upload content (string | Blob) to path (relative)
  async upload(path: string, content: Blob | string): Promise<void> {
    const url = this.absolutePath(path);
    const headers = this.headers();
    const body = content instanceof Blob ? content : new Blob([content], { type: 'application/octet-stream' });
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WebDAV upload failed (${res.status}): ${text}`);
    }
  }

  // Download file content as ArrayBuffer
  async download(path: string): Promise<ArrayBuffer> {
    const url = this.absolutePath(path);
    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WebDAV download failed (${res.status}): ${text}`);
    }
    return await res.arrayBuffer();
  }

  // Delete a remote file or collection
  async remove(path: string): Promise<void> {
    const url = this.absolutePath(path);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`WebDAV delete failed (${res.status}): ${text}`);
    }
  }

  // List files under path (use PROPFIND Depth:1). Returns array of items
  async list(path = ''): Promise<Array<{ href: string; isDirectory: boolean; size?: number; modified?: string }>> {
    const url = this.absolutePath(path || '/');
    const body = `<?xml version=\