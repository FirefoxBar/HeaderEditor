import { WebDAV, WebDAVConfig } from './webdav';

// Example helper to upload a JSON backup content to webdav
export async function exportBackupToWebDAV(cfg: WebDAVConfig, filename: string, jsonContent: string) {
  const client = new WebDAV(cfg);
  // optionally test connection first
  const ok = await client.testConnection();
  if (!ok) throw new Error('WebDAV connection test failed');
  const remotePath = `${cfg.root ? cfg.root.replace(/^\/|\/$/g, '') + '/' : ''}${filename}`;
  await client.upload(remotePath, jsonContent);
  return remotePath;
}

// Example helper to list backups in root and download selected file
export async function listBackupsFromWebDAV(cfg: WebDAVConfig) {
  const client = new WebDAV(cfg);
  const items = await client.list(cfg.root || '/');
  return items;
}

export async function downloadBackupFromWebDAV(cfg: WebDAVConfig, remotePath: string) {
  const client = new WebDAV(cfg);
  const buf = await client.download(remotePath);
  // Convert to string if JSON expected
  const text = new TextDecoder().decode(new Uint8Array(buf));
  return text;
}