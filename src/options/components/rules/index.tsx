import { Button, Card, Input, Dialog, Table } from '@alifd/next';
import * as React from 'react';
import Icon from 'share/components/icon';
import { t } from 'share/core/utils';
import './index.less';

interface RulesProps {
  visible: boolean;
}

interface RulesState {
  downloadUrl: string;
  showConfirm: boolean;
  import: any;
}

export default class Rules extends React.Component<RulesProps, RulesState> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return <section className={`section-rules ${this.props.visible ? 'visible' : 'in-visible'}`} />;
  }
}
