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

function getGlobalVars() {
  const obj = {
    ...browserConfig,
    IS_DEV: isDev,
    TARGET_BROWSER: targetBrowser,
  };
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, JSON.stringify(value)]),
  );
}

export default defineConfig({
  source: {
    define: getGlobalVars(),
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
    externals: [
      ({ request }, callback) => {
        // remove some pkgs from semi
        if (
          !isDev &&
          [
            'lottie-web',
            'prismjs',
            'remark-gfm',
            '@mdx-js/mdx',
            '@douyinfe/semi-json-viewer-core',
          ].includes(request || '')
        ) {
          return callback(undefined, '{}', 'var');
        }
        callback();
      },
      {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    ],
  },
  dev: {
    writeToDisk: true,
    hmr: false,
    liveReload: false,
  },
  performance: {
    // bundleAnalyze: {
    //   analyzerMode: 'static',
    //   openAnalyzer: false,
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
      node: {
        global: false,
      },
    },
  },
  environments: {
    background: {
      source: {
        entry: {
          background: {
            import: './src/pages/background/index.ts',
            html: false,
          },
        },
      },
      output: {
        target: 'web',
        copy: [
          {
            from: './public',
            to: '.',
          },
        ],
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      plugins: [pluginManifest()],
    },
    web: {
      source: {
        entry: {
          options: './src/pages/options/index.tsx',
          popup: './src/pages/popup/index.tsx',
        },
      },
      output: {
        copy: [
          {
            from: `./node_modules/react/umd/react.${isDev ? 'development' : 'production.min'}.js`,
            to: 'external/react.js',
          },
          {
            from: `./node_modules/react-dom/umd/react-dom.${isDev ? 'development' : 'production.min'}.js`,
            to: 'external/react-dom.js',
          },
        ],
      },
      performance: {
        chunkSplit: {
          strategy: 'split-by-experience',
          override: {
            cacheGroups: {
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
            },
          },
        },
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
              src: 'external/react.js',
            },
          },
          {
            tag: 'script',
            head: true,
            append: false,
            attrs: {
              src: 'external/react-dom.js',
            },
          },
        ],
      },
      plugins: [pluginReact()],
    },
  },
});
