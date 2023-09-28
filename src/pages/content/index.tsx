import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { cx, css } from '@emotion/css';
import browser from 'webextension-polyfill';
import { Card, Switch, Table, Popover, Banner } from '@douyinfe/semi-ui';
import { IconSetting, IconQuit } from '@douyinfe/semi-icons';
// import Api from '@/share/pages/api';
import type { Rule } from '@/share/core/types';
// import { VIRTUAL_KEY } from '@/share/core/constant';
import RuleDetail from '@/share/components/rule-detail';
import { APIs } from '@/share/core/constant';

let rules = [];
let enable = false;
// let loading = false;

console.log('content-script load.......................');
// contentScript.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('content-script收到的消息', message);

  switch (message.method) {
    case APIs.SET_PREFS:
      if (message.key === 'disable-all') {
        enable = !message.value;
      }
      ReactDOM.render(<Content />, app);
      break;
    case APIs.SAVE_RULE:
      setTimeout(() => {
        getData();
      }, 500);
      break;
    default:
      break;
  }
});


getData();


function getData() {
  browser.runtime.sendMessage({ greeting: '我是content-script呀，我主动发消息给后台！', method: 'GetData' }).then((response) => {
    console.log('收到来自后台的回复', response);
    if (response) {
      rules = response.rules || [];
      enable = response.enable || false;
      console.log('收到来自后台的回复', rules);
      ReactDOM.render(<Content />, app);
    }
  });
}


const basicStyle = css`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 300px;
  user-select: none;

  .cell-enable {
    padding-right: 0;
    .switch-container {
      display: flex;
      align-items: center;
    }
  }
`;


function Content() {
  const { Meta } = Card;

  // 可拖动
  const [isDragging, setIsDragging] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      e.preventDefault(); // 阻止默认的文本选择行为
      setIsDragging(true);
      offsetRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;

      // 限制拖动范围为窗口
      const maxX = window.innerWidth - divRef.current!.offsetWidth;
      const maxY = window.innerHeight - divRef.current!.offsetHeight;

      const boundedX = Math.min(Math.max(newX, 0), maxX);
      const boundedY = Math.min(Math.max(newY, 0), maxY);

      setPosition({ x: boundedX, y: boundedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFocus = () => {
    getData();
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isDragging]);

  const goToSetting = () => {
    browser.runtime.sendMessage({ url: browser.runtime.getURL('options.html'), method: APIs.OPEN_URL }).then((response) => {
      console.log('goToSetting收到来自后台的回复', response);
    });
    window.close();
  };

  const handleEnableChange = () => {
    browser.runtime.sendMessage({ key: 'disable-all', value: enable, method: APIs.SET_PREFS }).then((response) => {
      console.log('handleEnableChange收到来自后台的回复', response);
      enable = !enable;
      ReactDOM.render(<Content />, app);
    });
  };

  return enable ? (
    <div
      className={cx(basicStyle)}
      ref={divRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
    >
      <Card
        shadows="always"
        style={{ maxWidth: 400 }}
        bodyStyle={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        title={
          <Meta title="当前启用的规则" />
        }
        headerExtraContent={
          <div>
            <Popover
              position="top"
              showArrow
              content={
                <article style={{ padding: 6 }}>
                  管理规则
                </article>
          }
            >
              <IconSetting onClick={goToSetting} style={{ color: 'var(--semi-color-primary)' }} />
            </Popover>
            <Popover
              position="top"
              showArrow
              content={
                <article style={{ padding: 6 }}>
                  关闭插件
                </article>
          }
            >
              <IconQuit onClick={handleEnableChange} style={{ color: 'var(--semi-color-primary)', paddingLeft: '10px' }} />
            </Popover>
          </div>
      }
      >
        <div>
          { rules.length > 1 && <Banner
            type="info"
            description="相同的规则，后面的规则会覆盖前面的规则!"
          />
          }
          <Table
            rowKey="id"
            dataSource={rules}
            showHeader={false}
            size="small"
            columns={[
              {
                title: 'enable',
                dataIndex: 'enable',
                className: 'cell-enable',
                align: 'center',
                render: (value: boolean, item: Rule) => (
                  <div className="switch-container">
                    <Switch
                      size="small"
                      checked={value}
                      onChange={(checked) => {
                        item.enable = checked;
                        browser.runtime.sendMessage({ rule: item, method: APIs.SAVE_RULE }).then((response) => {
                          console.log('切换状态，收到来自后台的回复', response);
                        });
                        ReactDOM.render(<Content />, app);
                      }}
                    />
                  </div>
                ),
              },
              {
                title: 'group',
                dataIndex: 'group',
                render: (value: string) => (
                  <Popover showArrow position="top" content="分组名称" style={{ maxWidth: '300px' }}>
                    <div>{value}</div>
                  </Popover>
                ),
              },
              {
                title: 'name',
                dataIndex: 'name',
                render: (value: string, item: Rule) => (
                  <Popover showArrow position="top" content={<RuleDetail rule={item} />} style={{ maxWidth: '300px' }}>
                    <div>{value}</div>
                  </Popover>
                ),
              },
            ]}
            pagination={false}
          />
        </div>
      </Card>
    </div>
  ) : (<div />);
}

// 创建id为CRX-container的div
const app = document.createElement('div');
app.id = 'headerEditor-container';
app.setAttribute('class', 'semi-always-dark');

// // 添加鼠标事件
// let isDragging = false;
// let mouseOffsetX = 0;
// let mouseOffsetY = 0;

// app.addEventListener('mousedown', (event) => {
//   isDragging = true;
//   mouseOffsetX = event.clientX - app.offsetLeft;
//   mouseOffsetY = event.clientY - app.offsetTop;
// });

// document.addEventListener('mousemove', (event) => {
//   if (isDragging) {
//     app.style.left = `${event.clientX - mouseOffsetX}px`;
//     app.style.top = `${event.clientY - mouseOffsetY}px`;
//   }
// });

// document.addEventListener('mouseup', () => {
//   isDragging = false;
// });

// 将刚创建的div插入body最后
document.body.appendChild(app);

// 将ReactDOM插入刚创建的div
ReactDOM.render(<Content />, app);
