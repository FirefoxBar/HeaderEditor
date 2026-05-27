export function getNote(item) {
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  const text = [
    `* This is a ${item.browserConfig.IS_LITE_VER ? 'lite' : 'full'} version build.`,
    '* For build instructions and other information, please read the README.md',
  ];
  if (repo && runId) {
    text.push(
      `* This release conducted via GitHub Actions: https://github.com/${repo}/actions/runs/${runId}`,
    );
  }
  return text.join('\n\n');
}
