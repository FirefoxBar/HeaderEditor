import * as React from 'react';

interface IconProps {
  type: string;
}

const Icon = (props: IconProps) => <i className={`iconfont icon-${props.type}`} />;

export default Icon;
