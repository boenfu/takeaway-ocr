import {TakeawayChecker} from '../takeaway';

const meituanFlag = '合计';
const meituanFlag2 = '共计';
const eleFlag = '实付';

export const checkAmount: TakeawayChecker = (takeaway, word) => {
  if (takeaway.amount) {
    return;
  }

  let amount: string | undefined;

  if (word.includes(meituanFlag)) {
    amount = word.split(meituanFlag)[1].replace(/[^0-9.]/g, '');
  } else if (word.includes(meituanFlag2)) {
    amount = word.split(meituanFlag2)[1].replace(/[^0-9.]/g, '');
  } else if (word.includes(eleFlag)) {
    amount = word.split(eleFlag)[1].replace(/[^0-9.]/g, '');
  }

  if (amount) {
    takeaway.amount = +amount;
  }
};
