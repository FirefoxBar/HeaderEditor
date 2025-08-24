import usePref from '@/share/hooks/use-pref';
import AllRules from './all-rules';
import Common from './common';

const Rules = () => {
  const [type] = usePref('popup-show-rules');

  if (type === 'all') {
    return <AllRules />;
  }

  return <Common />;
};

export default Rules;
