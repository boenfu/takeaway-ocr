import {TakeawayChecker} from '../takeaway';

export const checkType: TakeawayChecker = (takeaway, word) => {
  if (takeaway.type) {
    return;
  }

  if (isMeiTuan(word)) {
    takeaway.type = 'meituan';
  } else if (isEle(word)) {
    takeaway.type = 'ele';
  }
};

const meiTuanKeysSet = new Set([
  '准时宝(商家赠送)',
  '放心吃(商家赠送)',
  'a联系骑手',
  '9致电商家',
  '美团红包',
  '美团快送',
  '通话录音,服务护航',
]);

function isMeiTuan(str: string): boolean {
  return meiTuanKeysSet.has(str);
}

const eleKeysSet = new Set(['电话骑士', '电话商家', '蜂鸟快送', '配送骑士']);

function isEle(str: string): boolean {
  return eleKeysSet.has(str);
}
