import {TakeawayChecker} from '../takeaway';

const meituanFlag = '口味:';
const meituanFlag2 = '自己會';
const eleFlag = '味道★';

export const checkComment: TakeawayChecker = (takeaway, word) => {
  if (takeaway.comment) {
    return;
  }

  if (word.startsWith(meituanFlag) || word.startsWith(meituanFlag2)) {
    return (takeaway, word) => {
      takeaway.comment = word;

      return (takeaway, word) => {
        takeaway.comment += `${word}...`;
      };
    };
  } else if (word.startsWith(eleFlag)) {
    return (takeaway, word) => {
      takeaway.comment = word;

      return (takeaway, word) => {
        takeaway.comment += `${word}...`;
      };
    };
  }

  return;
};
