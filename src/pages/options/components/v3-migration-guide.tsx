import React, { useState } from 'react';
import { Button, Card, Typography, Space, Alert, Divider } from 'antd';
import { CheckCircleOutlined, BugOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface V3MigrationGuideProps {
  onClose?: () => void;
}

export default function V3MigrationGuide({ onClose }: V3MigrationGuideProps) {
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleEnableDebug = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        method: 'enableDebugLogging',
      });
      setDebugEnabled(response.success);
    } catch (error) {
      console.error('启用调试日志失败:', error);
    }
  };

  const handleDisableDebug = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        method: 'disableDebugLogging',
      });
      setDebugEnabled(!response.success);
    } catch (error) {
      console.error('禁用调试日志失败:', error);
    }
  };

  const handleTestRules = async () => {
    setTesting(true);
    try {
      const response = await chrome.runtime.sendMessage({
        method: 'testRuleApplication',
      });

      const stats = await chrome.runtime.sendMessage({
        method: 'getRuleStats',
      });

      setTestResults({
        success: response.success,
        error: response.error,
        stats: stats.stats,
      });
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message,
        stats: null,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>Manifest V3 迁移指南</span>
        </Space>
      }
      extra={onClose && <Button onClick={onClose}>关闭</Button>}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          message="Header Editor 已成功迁移到 Manifest V3"
          description="新版本使用 declarativeNetRequest API 来修改网络请求，提供更好的性能和安全性。"
          type="success"
          showIcon
        />

        <div>
          <Title level={4}>主要变化</Title>
          <ul>
            <li>使用 declarativeNetRequest 替代 webRequest API</li>
            <li>规则在后台服务工作者中处理</li>
            <li>改进的性能和资源使用</li>
            <li>更严格的安全限制</li>
          </ul>
        </div>

        <div>
          <Title level={4}>功能限制</Title>
          <Alert
            message="部分功能在 V3 中不可用"
            description={
              <ul style={{ margin: 0 }}>
                <li>自定义 JavaScript 函数规则</li>
                <li>响应体修改功能</li>
                <li>复杂的正则表达式匹配</li>
                <li>某些高级网络拦截功能</li>
              </ul>
            }
            type="warning"
            showIcon
          />
        </div>

        <Divider />

        <div>
          <Title level={4}>调试工具</Title>
          <Space wrap>
            <Button
              type={debugEnabled ? 'primary' : 'default'}
              icon={<BugOutlined />}
              onClick={debugEnabled ? handleDisableDebug : handleEnableDebug}
            >
              {debugEnabled ? '禁用调试日志' : '启用调试日志'}
            </Button>

            <Button
              type="default"
              icon={<PlayCircleOutlined />}
              loading={testing}
              onClick={handleTestRules}
            >
              测试规则应用
            </Button>

            <Button
              type="default"
              onClick={() => {
                chrome.tabs.create({
                  url: `chrome://extensions/?id=${chrome.runtime.id}`,
                });
              }}
            >
              查看扩展详情
            </Button>
          </Space>
        </div>

        {testResults && (
          <div>
            <Title level={5}>测试结果</Title>
            <Alert
              message={testResults.success ? '测试成功' : '测试失败'}
              description={
                <div>
                  {testResults.error && (
                    <Text type="danger">错误: {testResults.error}</Text>
                  )}
                  {testResults.stats && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong>转换统计:</Text>
                      <ul>
                        <li>总规则数: {testResults.stats.total || 0}</li>
                        <li>已转换: {testResults.stats.converted || 0}</li>
                        <li>未转换: {testResults.stats.unconverted || 0}</li>
                        <li>警告数: {testResults.stats.warnings || 0}</li>
                      </ul>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      更多详细信息请查看浏览器控制台 (F12)
                    </Text>
                  </div>
                </div>
              }
              type={testResults.success ? 'success' : 'error'}
              showIcon
            />
          </div>
        )}

        <div>
          <Title level={4}>获取帮助</Title>
          <Paragraph>
            如果您遇到问题或需要帮助，请访问：
          </Paragraph>
          <Space>
            <Button
              type="link"
              onClick={() => chrome.tabs.create({ url: 'https://github.com/FirefoxBar/HeaderEditor/issues' })}
            >
              GitHub Issues
            </Button>
            <Button
              type="link"
              onClick={() => chrome.tabs.create({ url: 'https://he.firefoxcn.net' })}
            >
              官方网站
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
