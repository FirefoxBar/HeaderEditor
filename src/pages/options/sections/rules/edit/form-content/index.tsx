import {
  Collapse,
} from '@douyinfe/semi-ui';
import * as React from 'react';
import { t } from '@/share/core/utils';
import Basic from './basic';
import Exclude from './exclude';
import Execution from './execution';
import Match from './match';
import Test from './test';

interface FormContentProps {
  isEdit: boolean;
}

const FormContent = ({ isEdit }: FormContentProps) => (
  <Collapse defaultActiveKey={['basic', 'match', 'exclude', 'execution', 'test']} keepDOM>
    <Collapse.Panel header={t('basic_information')} itemKey="basic">
      <Basic isEdit={isEdit} />
    </Collapse.Panel>
    <Collapse.Panel header={t('matchType')} itemKey="match">
      <Match />
    </Collapse.Panel>
    <Collapse.Panel header={t('excludeRule')} itemKey="exclude">
      <Exclude />
    </Collapse.Panel>
    <Collapse.Panel header={t('execution')} itemKey="execution">
      <Execution />
    </Collapse.Panel>
    <Collapse.Panel header={t('test_url')} itemKey="test">
      <Test />
    </Collapse.Panel>
  </Collapse>
);

export default FormContent;
