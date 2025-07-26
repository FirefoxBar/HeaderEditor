import { AutoComplete as SemiAutoComplete, withField } from '@douyinfe/semi-ui';
import React, { FC, useCallback, useState } from 'react';
import type { AutoCompleteProps as SemiAutoCompleteProps } from '@douyinfe/semi-ui/lib/es/autoComplete';

interface AutoCompleteProps extends SemiAutoCompleteProps<string> {
  list: string[];
}

const AutoComplete: FC<AutoCompleteProps> = (props) => {
  const { list, ...rest } = props;

  const [data, setData] = useState<string[]>([]);

  const handleSearch = useCallback((v: string) => {
    setData(list.filter((x) => x.includes(v)));
  }, [list]);

  return <SemiAutoComplete {...rest} data={data} onSearch={handleSearch} />;
};

export default AutoComplete;
export const AutoCompleteField = withField(AutoComplete);
