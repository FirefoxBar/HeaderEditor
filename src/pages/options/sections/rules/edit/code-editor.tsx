import { withField } from '@douyinfe/semi-ui';
import Editor, { loader } from '@monaco-editor/react';
import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

interface CodeEditorProps {
  height?: number;
  value?: string;
  onChange?: (v: string) => void;
}

const CodeEditor = (props: CodeEditorProps) => {
  const { height, value, onChange } = props;
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    if (value && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <Editor
      height={height}
      defaultLanguage="javascript"
      defaultValue=""
      options={{
        insertSpaces: true,
        tabSize: 2,
        minimap: {
          enabled: false,
        },
      }}
      onMount={(instance) => {
        // @ts-ignore
        editorRef.current = instance;
        if (value) {
          instance.setValue(value);
        }
      }}
      onChange={onChange}
    />
  );
};

export default CodeEditor;
export const CodeEditorField = withField(CodeEditor);
