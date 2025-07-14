import browser from 'webextension-polyfill';
import logger from '@/share/core/logger';
import { prefs } from '@/share/core/prefs';

/**
 * 企业策略支持处理器
 * 在企业环境中提供完整的功能支持
 */
export class EnterpriseSupport {
  private static instance: EnterpriseSupport;
  private isEnterpriseEnvironment = false;
  private managementInfo: any = null;
  private policyInfo: any = null;

  constructor() {
    this.detectEnterpriseEnvironment();
  }

  static getInstance(): EnterpriseSupport {
    if (!EnterpriseSupport.instance) {
      EnterpriseSupport.instance = new EnterpriseSupport();
    }
    return EnterpriseSupport.instance;
  }

  /**
   * 检测是否在企业环境中
   */
  private async detectEnterpriseEnvironment(): Promise<void> {
    try {
      // 检查扩展是否由企业策略安装
      const managementInfo = await browser.management.getSelf();
      this.managementInfo = managementInfo;

      // 检查安装类型
      const isEnterpriseInstalled = managementInfo.installType === 'admin' ||
                                    managementInfo.installType === 'development';

      // 检查是否有企业策略
      const hasPolicySupport = await this.checkPolicySupport();

      this.isEnterpriseEnvironment = isEnterpriseInstalled || hasPolicySupport;

      if (this.isEnterpriseEnvironment) {
        logger.info('检测到企业环境，启用完整功能支持');
        await this.enableEnterpriseFeatures();
      }
    } catch (error) {
      logger.error('检测企业环境时发生错误:', error);
      this.isEnterpriseEnvironment = false;
    }
  }

  /**
   * 检查企业策略支持
   */
  private async checkPolicySupport(): Promise<boolean> {
    try {
      // 检查是否有企业策略 API
      if (!browser.enterprise || !browser.enterprise.platformKeys) {
        return false;
      }

      // 尝试检查企业策略设置
      // 这里可以添加更多的企业策略检测逻辑
      return true;
    } catch (error) {
      logger.debug('企业策略检测失败:', error);
      return false;
    }
  }

  /**
   * 启用企业功能
   */
  private async enableEnterpriseFeatures(): Promise<void> {
    try {
      // 记录企业环境信息
      await prefs.set('enterprise_mode', {
        enabled: true,
        installType: this.managementInfo?.installType,
        timestamp: Date.now(),
      });

      // 启用完整的 webRequest 功能
      await this.enableFullWebRequestSupport();

      // 设置企业特定的配置
      await this.applyEnterpriseConfiguration();

      logger.info('企业功能已启用');
    } catch (error) {
      logger.error('启用企业功能时发生错误:', error);
    }
  }

  /**
   * 启用完整的 webRequest 支持
   */
  private async enableFullWebRequestSupport(): Promise<void> {
    try {
      // 在企业环境中，可以使用完整的 webRequest API
      // 这里设置相关的配置标志
      await prefs.set('webRequest_enterprise_enabled', true);

      // 通知其他组件使用完整功能
      logger.info('企业环境中启用完整 webRequest 支持');
    } catch (error) {
      logger.error('启用 webRequest 支持时发生错误:', error);
    }
  }

  /**
   * 应用企业配置
   */
  private async applyEnterpriseConfiguration(): Promise<void> {
    try {
      // 企业特定的配置
      const enterpriseConfig = {
        // 允许更多的规则数量
        maxRules: 100000,
        // 允许复杂的正则表达式
        allowComplexRegex: true,
        // 允许用户自定义函数
        allowCustomFunctions: true,
        // 允许响应体修改
        allowResponseBodyModification: true,
        // 禁用一些限制
        disableV3Restrictions: true,
      };

      await prefs.set('enterprise_config', enterpriseConfig);
      logger.info('企业配置已应用:', enterpriseConfig);
    } catch (error) {
      logger.error('应用企业配置时发生错误:', error);
    }
  }

  /**
   * 检查当前是否为企业环境
   */
  isEnterpriseMode(): boolean {
    return this.isEnterpriseEnvironment;
  }

  /**
   * 获取企业信息
   */
  getEnterpriseInfo(): {
    isEnterprise: boolean;
    installType?: string;
    hasFullSupport: boolean;
    supportedFeatures: string[];
  } {
    return {
      isEnterprise: this.isEnterpriseEnvironment,
      installType: this.managementInfo?.installType,
      hasFullSupport: this.isEnterpriseEnvironment,
      supportedFeatures: this.isEnterpriseEnvironment ? [
        'webRequest',
        'customFunctions',
        'responseBodyModification',
        'unlimitedRules',
        'complexRegex',
      ] : [],
    };
  }

  /**
   * 请求企业策略权限
   */
  async requestEnterprisePermissions(): Promise<boolean> {
    try {
      if (!this.isEnterpriseEnvironment) {
        logger.warn('非企业环境，无法请求企业权限');
        return false;
      }

      // 请求额外的权限
      const granted = await browser.permissions.request({
        permissions: ['webRequest', 'webRequestBlocking', 'management'],
        origins: ['*://*/*'],
      });

      if (granted) {
        logger.info('企业权限已授予');
        await this.enableEnterpriseFeatures();
      }

      return granted;
    } catch (error) {
      logger.error('请求企业权限时发生错误:', error);
      return false;
    }
  }

  /**
   * 获取企业策略配置
   */
  async getEnterpriseConfig(): Promise<any> {
    try {
      return await prefs.get('enterprise_config') || {};
    } catch (error) {
      logger.error('获取企业配置时发生错误:', error);
      return {};
    }
  }

  /**
   * 设置企业策略配置
   */
  async setEnterpriseConfig(config: any): Promise<void> {
    try {
      if (!this.isEnterpriseEnvironment) {
        throw new Error('非企业环境，无法设置企业配置');
      }

      await prefs.set('enterprise_config', config);
      logger.info('企业配置已更新:', config);
    } catch (error) {
      logger.error('设置企业配置时发生错误:', error);
      throw error;
    }
  }

  /**
   * 生成企业部署指南
   */
  generateDeploymentGuide(): {
    policyTemplate: any;
    installationSteps: string[];
    configurationOptions: any;
  } {
    return {
      policyTemplate: {
        '3rdparty': {
          extensions: {
            'headereditor@addon.firefoxcn.net': {
              enterprise_mode: true,
              max_rules: 100000,
              allow_custom_functions: true,
              allow_response_body_modification: true,
              disable_v3_restrictions: true,
            },
          },
        },
      },
      installationSteps: [
        '1. 下载企业版 Header Editor 扩展包',
        '2. 创建企业策略配置文件',
        '3. 通过 Group Policy 或 MDM 部署策略',
        '4. 在目标机器上安装扩展',
        '5. 验证企业功能是否正常工作',
      ],
      configurationOptions: {
        maxRules: {
          description: '最大规则数量',
          type: 'number',
          default: 100000,
          min: 1000,
          max: 1000000,
        },
        allowCustomFunctions: {
          description: '允许自定义函数',
          type: 'boolean',
          default: true,
        },
        allowResponseBodyModification: {
          description: '允许响应体修改',
          type: 'boolean',
          default: true,
        },
        disableV3Restrictions: {
          description: '禁用 V3 限制',
          type: 'boolean',
          default: true,
        },
      },
    };
  }

  /**
   * 验证企业功能
   */
  async validateEnterpriseFeatures(): Promise<{
    isValid: boolean;
    availableFeatures: string[];
    missingFeatures: string[];
    recommendations: string[];
  }> {
    try {
      const availableFeatures: string[] = [];
      const missingFeatures: string[] = [];
      const recommendations: string[] = [];

      // 检查 webRequest 权限
      const permissions = await browser.permissions.getAll();
      if (permissions.permissions?.includes('webRequest')) {
        availableFeatures.push('webRequest');
      } else {
        missingFeatures.push('webRequest');
        recommendations.push('需要通过企业策略授予 webRequest 权限');
      }

      // 检查管理权限
      if (permissions.permissions?.includes('management')) {
        availableFeatures.push('management');
      } else {
        missingFeatures.push('management');
      }

      // 检查企业配置
      const enterpriseConfig = await this.getEnterpriseConfig();
      if (Object.keys(enterpriseConfig).length > 0) {
        availableFeatures.push('enterpriseConfig');
      } else {
        missingFeatures.push('enterpriseConfig');
        recommendations.push('需要设置企业配置');
      }

      return {
        isValid: missingFeatures.length === 0,
        availableFeatures,
        missingFeatures,
        recommendations,
      };
    } catch (error) {
      logger.error('验证企业功能时发生错误:', error);
      return {
        isValid: false,
        availableFeatures: [],
        missingFeatures: ['unknown'],
        recommendations: ['验证过程中发生错误，请检查日志'],
      };
    }
  }

  /**
   * 获取企业支持状态
   */
  async getStatus(): Promise<{
    isSupported: boolean;
    installType: string;
    features: any;
    config: any;
    validation: any;
  }> {
    try {
      const validation = await this.validateEnterpriseFeatures();

      return {
        isSupported: this.isEnterpriseEnvironment,
        installType: this.managementInfo?.installType || 'unknown',
        features: this.getEnterpriseInfo(),
        config: await this.getEnterpriseConfig(),
        validation,
      };
    } catch (error) {
      logger.error('获取企业支持状态时发生错误:', error);
      return {
        isSupported: false,
        installType: 'unknown',
        features: { isEnterprise: false, hasFullSupport: false, supportedFeatures: [] },
        config: {},
        validation: { isValid: false, availableFeatures: [], missingFeatures: [], recommendations: [] },
      };
    }
  }
}

export default EnterpriseSupport;
