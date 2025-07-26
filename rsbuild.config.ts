import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import browserConfigs from './scripts/browser-config/browser.config.json' with {
  type: 'json',
};
import { getDistDir } from './scripts/browser-config/get-path';
import { pluginManifest } from './scripts/rsbuild/manifest.plugin';

const targetBrowser = String(process.env.TARGET_BROWSER) || 'firefox_v3';

const browserConfig =
  browserConfigs[targetBrowser as keyof typeof browserConfigs];

const isDev = process.env.NODE_ENV === 'development';

const baseExternals = {
  react: 'React',
  'react-dom': 'ReactDOM',
};

export default defineConfig({
  source: {
    entry: {
      background: {
        import: './src/pages/background/index.ts',
        html: false,
      },
      options: './src/pages/options/index.tsx',
      popup: './src/pages/popup/index.tsx',
    },
    define: {
      ...browserConfig,
      IS_DEV: isDev,
      TARGET_BROWSER: targetBrowser,
    },
  },
  output: {
    manifest: false,
    polyfill: 'off',
    filenameHash: false,
    legalComments: 'inline',
    distPath: {
      root: `./${getDistDir(targetBrowser)}`,
      html: './',
      js: 'assets/js',
      css: 'assets/css',
    },
    copy: [
      {
        from: `./node_modules/react/umd/react.${isDev ? 'development' : 'production.min'}.js`,
        to: 'external/react.min.js',
      },
      {
        from: `./node_modules/react-dom/umd/react-dom.${isDev ? 'development' : 'production.min'}.js`,
        to: 'external/react-dom.min.js',
      },
      {
        from: './public',
        to: '.',
      },
    ],
    externals: browserConfig.ENABLE_EVAL
      ? baseExternals
      : [
          ({ context, request }, callback) => {
            if (['text-encoding'].includes(request || '')) {
              return callback(undefined, '{}', 'var');
            }
            callback();
          },
          baseExternals,
        ],
  },
  html: {
    title: 'Header Editor',
    tags: [
      {
        tag: 'style',
        children:
          'body{margin:0;background-color:var(--semi-color-bg-0);color:var(--semi-color-text-0)}',
      },
      {
        tag: 'script',
        head: true,
        append: false,
        attrs: {
          src: 'external/react.min.js',
        },
      },
      {
        tag: 'script',
        head: true,
        append: false,
        attrs: {
          src: 'external/react-dom.min.js',
        },
      },
    ],
  },
  dev: {
    writeToDisk: true,
    hmr: false,
    liveReload: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'custom',
      splitChunks: {
        chunks: 'all',
        minChunks: 100,
        cacheGroups: {
          default: false,
          codemirror: {
            name: 'codemirror',
            test: /codemirror/,
            enforce: true,
          },
          semi: {
            name: 'semi',
            test: /(@douyinfe[/+]semi-|date-fns|async-validator)/,
            enforce: true,
          },
          common: {
            name: 'common',
            test: /(@dnd-kit)/,
            enforce: true,
          },
        },
      },
    },
    // bundleAnalyze: {
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
    //   reportFilename: `report-${targetBrowser}.html`,
    // },
  },
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [['@swc/plugin-emotion', {}]],
        },
      },
    },
    rspack: {
      output: {
        asyncChunks: false,
      },
    },
  },
  plugins: [pluginReact(), pluginManifest()],
});
