module.exports = {
  solution: '@nowa/solution-react-component',
  config: {
    build: [
      {
        // build命令配置
        entry: './src/index.ts', // 修改 entry
        cssModules: false
      },
    ],
    server: [
      {
        // server命令配置
        cssModules: false,
      },
    ]
  }
}