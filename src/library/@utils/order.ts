import {TakeawayChecker} from '../takeaway';

const IDReg = /^[0-9]+复制$/;
const IDReg2 = /^订单号码[0-9]+$/;

export const checkOrderId: TakeawayChecker = (takeaway, word) => {
  if (takeaway.order_id) {
    return;
  }

  if (IDReg.test(word)) {
    takeaway.order_id = word.slice(0, -2);
  } else if (IDReg2.test(word)) {
    takeaway.order_id = word.slice(4);
  }
};

const meituanDateReg = /^订单时间[0-9:-]+$/;

export const checkOrderDate: TakeawayChecker = (takeaway, word) => {
  if (takeaway.order_date) {
    return;
  }

  if (word === '下单时间') {
    return (takeaway, word) => {
      takeaway.order_date = word;
    };
  } else if (meituanDateReg.test(word)) {
    takeaway.order_date = word.slice(4);
  }

  return;
};
