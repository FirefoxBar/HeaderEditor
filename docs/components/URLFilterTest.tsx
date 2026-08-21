import { useRequest } from 'ahooks';
import jsonata from 'jsonata';
import { random } from 'lodash-es';
import { type FC, useState } from 'react';
import { createUrlFilterRegex } from '../../src/share/core/rule-utils';
import './URLFilterTest.css';

interface URLFilterTestProps {
  lang: {
    inputData: string;
    inputExpr: string;
    executing: string;
    error: string;
    result: string;
  };
}

const URLFilterTest: FC<URLFilterTestProps> = ({ lang }) => {
  const [url, setUrl] = useState('');
  const [expr, setExpr] = useState('');

  const {
    data: result,
    loading,
    error,
  } = useRequest(
    async () => {
      const e = createUrlFilterRegex(expr);
      return e.test(url);
    },
    {
      manual: false,
      refreshDeps: [url, expr],
      debounceWait: 500,
      onError: e => console.error('run error', e),
    },
  );

  return (
    <div className="url-filter-test">
      <input
        type="text"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder={lang.inputData}
      />
      <input
        type="text"
        value={expr}
        onChange={e => setExpr(e.target.value)}
        placeholder={lang.inputExpr}
      />
      {loading && (
        <div className="result">
          <div className="content">{lang.executing}</div>
        </div>
      )}
      {error && !loading && (
        <div className="result">
          <div className="title">{lang.error}</div>
          <div className="content">{error.message}</div>
        </div>
      )}
      {!error && !loading && (
        <div className="result">
          <div className="title">{lang.result}</div>
          <pre className="content">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default URLFilterTest;
