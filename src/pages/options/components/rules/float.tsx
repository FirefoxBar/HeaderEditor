import { Button, Card } from '@alifd/next';
import React from 'react';
import { Rule } from '@/share/core/var';
import RuleDetail from './ruleDetail';

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
    const box: HTMLElement = (el => {
      let p: any = el;
      while (p) {
        if (p.classList.contains('float-card')) {
          return p;
        }
        p = p.parentElement;
      }
    })(e.target);
    console.log(box);
    const offset = (el => {
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
      box.style.top = offset.top + 'px';
      box.style.left = offset.left + 'px';
      if (!end) {
        requestAnimationFrame(setNewOffset);
      }
    }
    setNewOffset();
  };

  return (
    <Card className="float-card" free>
      <Card.Header
        title={rule.name}
        onTouchStart={handleStart}
        onMouseDown={handleStart}
        extra={
          <Button type="primary" text onClick={onClose}>
            关闭
          </Button>
        }
      />
      <Card.Divider />
      <Card.Content>
        <RuleDetail rule={rule} />
      </Card.Content>
    </Card>
  );
};

export default Float;
