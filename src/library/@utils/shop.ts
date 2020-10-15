import {TakeawayChecker} from '../takeaway';

const meituanKeysSet = new Set(['商家已接单', '订单已完成']);
const eleFlag = '我的评价';

const extraTextReg = (str: string): string =>
  str.replace(/[^\u4E00-\u9FA5A-Za-z0-9]/g, '');

export const checkShop: TakeawayChecker = (takeaway, word) => {
  if (takeaway.shop) {
    return;
  }

  if (meituanKeysSet.has(extraTextReg(word))) {
    return (takeaway, word) => {
      takeaway.shop = extraTextReg(word);
    };
  } else if (word.includes(eleFlag)) {
    return (takeaway, word) => {
      if (word.includes('配送信息')) {
        return;
      }

      takeaway.shop = word;
    };
  }

  return;
};
