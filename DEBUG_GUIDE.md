# Header Editor V3 调试指南

## 问题：请求网址时没有添加 x-tag header

### 🔍 调试步骤

#### 1. 检查规则是否已创建
首先确认您是否已经正确创建了添加 x-tag header 的规则：

**在 Header Editor 选项页面：**
1. 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
2. 找到 Header Editor，点击"详细信息"
3. 点击"扩展程序选项"
4. 检查是否有类似以下的规则：
   - 规则类型：修改发送头
   - 头名称：x-tag (或 X-Tag)
   - 头内容：您想要的值
   - 匹配类型：全部（或特定模式）
   - 启用状态：✅ 已启用

#### 2. 使用调试工具检查规则状态
打开浏览器开发者工具 (F12)，在 Console 中执行：

```javascript
// 检查 x-tag 规则的完整状态
testXTagHeaderRule()
```

这个命令将：
- 检查当前的规则
- 如果没有 x-tag 规则，自动创建一个测试规则
- 验证规则转换是否正确
- 检查 V3 规则是否正确应用

#### 3. 检查扩展是否被禁用
```javascript
// 检查扩展是否被禁用
chrome.runtime.sendMessage({method: 'getRuleStats'})
```

#### 4. 启用调试日志
```javascript
// 启用详细的调试日志
chrome.runtime.sendMessage({method: 'enableDebugLogging'})
```

启用后，刷新页面并查看控制台输出，查找相关的规则应用信息。

#### 5. 验证规则是否生效
访问 https://httpbin.org/headers 来检查请求头：

1. 打开 https://httpbin.org/headers
2. 查看返回的 JSON 中的 `headers` 字段
3. 检查是否包含您的 x-tag header

**或者在开发者工具中检查：**
1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新页面
4. 点击任意请求
5. 在 Headers 标签中查看 Request Headers
6. 查找您的 x-tag header

### 🚨 常见问题和解决方案

#### 问题 1：规则存在但没有生效
**可能原因：**
- 规则转换失败
- V3 规则没有正确应用
- 匹配条件不正确

**解决方案：**
```javascript
// 强制刷新规则
chrome.runtime.sendMessage({method: 'testRuleApplication'})
```

#### 问题 2：规则转换失败
**可能原因：**
- 规则格式不正确
- 包含不支持的功能

**解决方案：**
确保规则满足以下条件：
- 规则类型为 `modifySendHeader`
- 不使用自定义函数 (`isFunction: false`)
- Header 名称和值都不为空

#### 问题 3：V3 规则限制
**可能原因：**
- Chrome 的 declarativeNetRequest 有一些限制

**解决方案：**
- 确保 header 名称符合 HTTP 规范
- 避免使用特殊字符
- 检查是否超过规则数量限制

### 🔧 手动创建测试规则

如果自动创建不工作，可以手动创建：

1. 打开 Header Editor 选项页面
2. 点击"添加规则"
3. 填写以下信息：
   - 名称：`测试 X-Tag Header`
   - 规则类型：`修改发送头`
   - 匹配类型：`全部`
   - 执行类型：`普通`
   - 头名称：`X-Tag`
   - 头内容：`test-value`
4. 点击保存

### 📊 检查规则统计

```javascript
// 获取当前规则统计
chrome.runtime.sendMessage({method: 'getRuleStats'}).then(response => {
  console.log('规则统计:', response.stats);
});

// 获取当前应用的 V3 规则
chrome.declarativeNetRequest.getDynamicRules().then(rules => {
  console.log('当前 V3 规则:', rules);
  const headerRules = rules.filter(rule => 
    rule.action.type === 'modifyHeaders' && 
    rule.action.requestHeaders
  );
  console.log('修改请求头的规则:', headerRules);
});
```

### 🔍 深度调试

如果上述步骤都没有解决问题，请：

1. **收集调试信息：**
   ```javascript
   // 收集完整的调试信息
   const debugInfo = {
     rules: await chrome.runtime.sendMessage({method: 'getRuleStats'}),
     v3Rules: await chrome.declarativeNetRequest.getDynamicRules(),
     permissions: await chrome.permissions.getAll()
   };
   console.log('调试信息:', debugInfo);
   ```

2. **检查权限：**
   确保扩展有以下权限：
   - `declarativeNetRequest`
   - `declarativeNetRequestWithHostAccess` 
   - 相关的主机权限

3. **检查浏览器版本：**
   确保使用 Chrome 88+ 或其他支持 Manifest V3 的浏览器

### 📝 报告问题

如果问题仍然存在，请提供以下信息：

1. 浏览器版本
2. Header Editor 版本
3. 创建的规则详情
4. 调试输出结果
5. 期望的行为 vs 实际行为

这将帮助我们更好地诊断和解决问题。 