import React, { useState } from 'react';
import { WebDAVConfig } from '../services/webdav';
import { exportBackupToWebDAV, listBackupsFromWebDAV, downloadBackupFromWebDAV } from '../services/backupWebdav';

type Props = {
  getLocalBackupContent: () => Promise<string>; // provided by parent: returns JSON string of current config
  restoreFromJsonString: (json: string) => Promise<void>; // parent will apply restore
};

export const WebDAVPanel: React.FC<Props> = ({ getLocalBackupContent, restoreFromJsonString }) => {
  const [cfg, setCfg] = useState<WebDAVConfig>({ url: '', root: '' });
  const [status, setStatus] = useState<string>('');
  const [remoteFiles, setRemoteFiles] = useState<Array<any>>([]);

  async function test() {
    try {
      setStatus('Testing...');
      // dynamic import avoids bundler issues in some setups — adjust as needed
      const { WebDAV } = await import('../services/webdav');
      const client = new WebDAV(cfg);
      const ok = await client.testConnection();
      setStatus(ok ? 'Connection OK' : 'Connection failed');
    } catch (e:any) {
      setStatus('Error: ' + e.message);
    }
  }

  async function uploadBackup() {
    try {
      setStatus('Preparing backup...');
      const content = await getLocalBackupContent();
      const filename = `backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
      setStatus('Uploading...');
      await exportBackupToWebDAV(cfg, filename, content);
      setStatus('Upload successful: ' + filename);
    } catch (e:any) {
      setStatus('Upload failed: ' + e.message);
    }
  }

  async function listFiles() {
    try {
      setStatus('Listing...');
      const items = await listBackupsFromWebDAV(cfg);
      setRemoteFiles(items);
      setStatus('Listed ' + items.length + ' items');
    } catch (e:any) {
      setStatus('List failed: ' + e.message);
    }
  }

  async function downloadAndRestore(href: string) {
    try {
      setStatus('Downloading...');
      const text = await downloadBackupFromWebDAV(cfg, href);
      setStatus('Restoring...');
      await restoreFromJsonString(text);
      setStatus('Restore complete');
    } catch (e:any) {
      setStatus('Restore failed: ' + e.message);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <h3>WebDAV 备份 / 恢复</h3>
      <div style={{ marginBottom: 8 }}>
        <label>服务器 URL</label><br/>
        <input style={{ width: '100%' }} value={cfg.url} onChange={e => setCfg({...cfg, url: e.target.value})} placeholder="https://webdav.example.com" />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>根路径（可选）</label><br/>
        <input style={{ width: '100%' }} value={cfg.root} onChange={e => setCfg({...cfg, root: e.target.value})} placeholder="backups" />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>用户名</label><br/>
        <input style={{ width: '100%' }} value={cfg.username || ''} onChange={e => setCfg({...cfg, username: e.target.value})} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>密码 / Token（Token 优先）</label><br/>
        <input style={{ width: '100%' }} value={cfg.password || cfg.token || ''} onChange={e => {
          setCfg({...cfg, password: e.target.value, token: undefined});
        }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={test}>测试连接</button>
        <button onClick={uploadBackup}>导出并上传当前配置</button>
        <button onClick={listFiles}>列出远端备份</button>
      </div>
      <div style={{ marginTop: 10 }}>Status: {status}</div>
      <ul>
        {remoteFiles.map((it, idx) => (
          <li key={idx}>
            <span style={{ wordBreak: 'break-all' }}>{it.href} {it.isDirectory ? '(dir)' : ''}</span>
            {!it.isDirectory && <button style={{ marginLeft: 8 }} onClick={() => downloadAndRestore(it.href)}>下载并恢复</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};
