import {TakeawayChecker} from '../takeaway';

const meituanFlag = '商家★';
const meituanFlag2 = '自己會';
const eleFlag = '★';

export const checkScore: TakeawayChecker = (takeaway, word) => {
  if (takeaway.score) {
    return;
  }

  let score: number | string | undefined;

  if (word.startsWith(meituanFlag)) {
    score = word.length - word.replace(/★/g, '').length;
  } else if (word.startsWith(meituanFlag2)) {
    score = word.length - word.replace(/會/g, '').length;
  } else if (word.includes(eleFlag)) {
    if (new Set(word).size !== 1) {
      return;
    }

    score = word.length;
  }

  if (score) {
    takeaway.score = +score;
  }
};
