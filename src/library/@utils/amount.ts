import {TakeawayChecker} from '../takeaway';

const meituanFlag = '合计￥';
const eleFlag = '实付';

export const checkAmount: TakeawayChecker = (takeaway, word) => {
  if (takeaway.amount) {
    return;
  }

  let amount: string | undefined;

  if (word.includes(meituanFlag)) {
    amount = word.split(meituanFlag)[1];
  } else if (word.includes(eleFlag)) {
    amount = word.split(eleFlag)[1];
  }

  if (amount) {
    takeaway.amount = +amount;
  }
};
