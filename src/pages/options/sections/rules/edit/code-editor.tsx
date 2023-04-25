import { withField } from '@douyinfe/semi-ui';
import React from 'react';
import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import isDarkMode from '@/share/pages/is-dark-mode';

type CodeEditorProps = ReactCodeMirrorProps;

const CodeEditor = (props: CodeEditorProps) => (
  <CodeMirror
    {...props}
    theme={isDarkMode() ? githubDark : githubLight}
    extensions={[javascript()]}
  />
);

export default CodeEditor;
export const CodeEditorField = withField(CodeEditor);
