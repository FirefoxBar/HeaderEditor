import { javascript } from '@codemirror/lang-javascript';
import { withField } from '@douyinfe/semi-ui';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
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
