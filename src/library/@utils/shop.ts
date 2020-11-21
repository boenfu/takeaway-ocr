import {TakeawayChecker} from '../takeaway';

const meituanKeysSet = new Set(['商家已接单', '订单已完成', '订单详情']);
const eleFlag = '我的评价';

const extraTextReg = (str: string): string =>
  str.replace(/[^\u4E00-\u9FA5A-Za-z0-9]/g, '');

export const checkShop: TakeawayChecker = async (
  takeaway,
  word,
  {shopName, nlp},
) => {
  if (takeaway.shop) {
    return;
  }

  if (shopName && nlp) {
    // nlp 模式

    if (Math.abs(shopName.length - word.length) > shopName.length / 2) {
      return;
    }

    if ((await nlp.simnet(shopName, word)) > 0.9) {
      takeaway.shop = shopName;
    }
  } else {
    if (meituanKeysSet.has(extraTextReg(word))) {
      return (takeaway, word) => {
        takeaway.shop = extraTextReg(word);
      };
    } else if (word.includes(eleFlag)) {
      return (takeaway, word) => {
        if (word.includes('配送信息') || word.startsWith('已贡献')) {
          return;
        }

        takeaway.shop = word;
      };
    }
  }

  return;
};
