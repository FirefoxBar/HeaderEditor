import { useGetState } from 'ahooks';
import { type FC, useEffect, useState } from 'react';
import { createUrlFilterRegex } from '../../src/share/core/rule-utils';
import './URLFilterTest.css';

interface URLFilterTestProps {
  lang: {
    inputData: string;
    inputExpr: string;
    match: string;
    noMatch: string;
  };
}

const URLFilterTest: FC<URLFilterTestProps> = ({ lang }) => {
  const [url, setUrl] = useState('');
  const [expr, setExpr] = useState('');

  const [result, setResult, getResult] = useGetState('');

  useEffect(() => {
    const c = { expr, url };

    if (getResult() !== '') {
      setResult('');
    }

    setTimeout(() => {
      if (c.expr !== expr || c.url !== url) {
        return;
      }
      try {
        const e = createUrlFilterRegex(expr);
        setResult(e.test(url) ? lang.match : lang.noMatch);
      } catch (error) {
        console.error(error);
        setResult((error as Error).message);
      }
    }, 500);
  }, [url, expr]);

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
      <div className="result">{result}</div>
    </div>
  );
};

export default URLFilterTest;
