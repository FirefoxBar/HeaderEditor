import React from 'react';
import { Button, Typography } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';
import { css, cx } from '@emotion/css';
import RuleDetail from '@/share/components/rule-detail';
import type { Rule } from '@/share/core/types';

function isTouchEvent(obj: Event): obj is TouchEvent {
  return typeof TouchEvent !== 'undefined' && obj instanceof TouchEvent;
}

interface FloatProps {
  rule: Rule;
  onClose: () => void;
}

const Float = (props: FloatProps) => {
  const { rule, onClose } = props;

  const handleStart = (re: any) => {
    const e: TouchEvent | MouseEvent = re.nativeEvent;
    const box: HTMLElement = ((el) => {
      let p: any = el;
      while (p) {
        if (p.classList.contains('float-card')) {
          return p;
        }
        p = p.parentElement;
      }
    })(e.target);
    const offset = ((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
      };
    })(box);
    const last = isTouchEvent(e)
      ? {
        x: e.touches[0].pageX,
        y: e.touches[0].pageY,
      }
      : {
        x: e.pageX,
        y: e.pageY,
      };
    let end = false;
    if (isTouchEvent(e)) {
      const onTouchMove = (ev: TouchEvent) => {
        offset.top += ev.touches[0].pageY - last.y;
        last.y = ev.touches[0].pageY;
        offset.left += ev.touches[0].pageX - last.x;
        last.x = ev.touches[0].pageX;
        ev.stopPropagation();
        ev.preventDefault();
      };
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
      document.body.addEventListener('touchend', () => {
        end = true;
        document.body.removeEventListener('touchmove', onTouchMove);
      });
      document.body.addEventListener('touchcancel', () => {
        end = true;
        document.body.removeEventListener('touchmove', onTouchMove);
      });
    } else {
      const onMouseMove = (ev: MouseEvent) => {
        offset.top += ev.pageY - last.y;
        last.y = ev.pageY;
        offset.left += ev.pageX - last.x;
        last.x = ev.pageX;
      };
      document.body.addEventListener('mousemove', onMouseMove);
      document.body.addEventListener('mouseup', () => {
        end = true;
        document.body.removeEventListener('mousemove', onMouseMove);
      });
    }
    function setNewOffset() {
      box.style.top = `${offset.top}px`;
      box.style.left = `${offset.left}px`;
      if (!end) {
        requestAnimationFrame(setNewOffset);
      }
    }
    setNewOffset();
  };

  return (
    <div
      className={cx('float-card', 'semi-modal-content', css`
        position: fixed;
        z-index: 9999;
        top: 100px;
        left: calc(50% - 200px);
        width: 400px;
        max-height: 100vh;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        height: auto;

        .semi-modal-title {
          cursor: move;
          user-select: none;
        }
      `)}
    >
      <div className="semi-modal-header">
        <Typography.Title heading={5} className="semi-modal-title" onMouseDown={handleStart} onTouchStart={handleStart}>{rule.name}</Typography.Title>
        <Button
          className="semi-modal-close"
          icon={<IconClose />}
          size="small"
          theme="borderless"
          type="tertiary"
          onClick={onClose}
        />
      </div>
      <div className="semi-modal-body"><RuleDetail rule={rule} /></div>
    </div>
  );
};

export default Float;
