import {TakeawayChecker} from '../takeaway';

const IDReg = /^[0-9]+复制$/;

export const checkOrderId: TakeawayChecker = (takeaway, word) => {
  if (takeaway.order_id) {
    return;
  }

  if (IDReg.test(word)) {
    takeaway.order_id = word.slice(0, -2);
  }
};

export const checkOrderDate: TakeawayChecker = (takeaway, word) => {
  if (takeaway.order_date) {
    return;
  }

  if (word !== '下单时间') {
    return;
  }

  return (takeaway, word) => {
    takeaway.order_date = word;
  };
};
