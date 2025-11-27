## WebDAV 备份/恢复

新增：WebDAV 备份/恢复

- 在导入/导出对话中增加 WebDAV 选项：可以上传备份文件到用户指定的 WebDAV 服务器，或从 WebDAV 列表中下载并恢复。
- 需要在 manifest 中添加 host_permissions（或使用 optional_permissions），并声明 storage 权限用于保存（可选）服务器配置。
- 安全提示：建议不要明文存储用户名/密码；可使用 Web Crypto 对凭证加密或要求用户每次输入密码。

使用示例：
1. 在导出时选择“WebDAV”，填写服务器地址、用户名与密码/Token，点击上传，备份会被 PUT 到服务器。
2. 在导入时选择“WebDAV”，列出远端文件，选择一个文件下载并恢复。

实现细节：
- 客户端实现位于 src/services/webdav.ts，提供 list/upload/download/remove, 支持 Basic 和 Bearer token。
- UI 示例在 src/ui/WebDAVPanel.tsx，父组件需要注入 getLocalBackupContent 与 restoreFromJsonString 两个函数来完成本地数据导出/恢复调用。
- 注意：fetch 的 PROPFIND/PUT/DELETE 等请求在浏览器环境下仍受远端服务器 CORS 限制，建议在 manifest 中声明合适 host_permissions 或在 background script 中代理请求.
