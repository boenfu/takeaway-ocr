import {OCR} from './@ocr';
import {
  checkAmount,
  checkComment,
  checkOrderDate,
  checkOrderId,
  checkScore,
  checkShop,
  checkType,
} from './@utils';

export type TakeawayChecker = (
  takeaway: Takeaway,
  word: string,
) => TakeawayChecker | true | void;

export interface Takeaway {
  type?: 'meituan' | 'ele';
  shop?: string;
  order_id?: string;
  order_date?: string;
  amount?: number;
  comment?: string;
  score?: number;
}

export class TakeawayOCR {
  ocr: OCR;

  constructor(id: string, key: string, secret: string) {
    this.ocr = new OCR(id, key, secret);
  }

  async match(urls: string[]): Promise<Takeaway | undefined> {
    const defaultTakeaway: Takeaway = {
      type: undefined,
      shop: undefined,
      order_id: undefined,
      order_date: undefined,
      amount: undefined,
      comment: undefined,
      score: undefined,
    };

    let nextCheckers: TakeawayChecker[] = [];

    let runCheckers = (word: string, checkers: TakeawayChecker[]): void => {
      for (let checker of checkers) {
        let result = checker(defaultTakeaway, word);

        if (result === true) {
          return;
        }

        if (typeof result === 'function') {
          nextCheckers.push(result);
        }
      }
    };

    for (let url of urls) {
      if (isComplete(defaultTakeaway)) {
        return defaultTakeaway;
      }

      let words = await this.ocr.get(url, /^https?:\/\/([\w-]+.)+/.test(url));

      if (!words?.length) {
        continue;
      }

      for (let word of words) {
        let checkers = [...nextCheckers];
        nextCheckers = [];

        runCheckers(word, [
          ...checkers,
          checkType,
          checkShop,
          checkOrderId,
          checkOrderDate,
          checkAmount,
          checkComment,
          checkScore,
        ]);
      }
    }

    return defaultTakeaway;
  }
}

// utils

function isComplete(takeaway: Takeaway): takeaway is Required<Takeaway> {
  return Array.from(Object.values(takeaway)).every(
    value => value !== undefined,
  );
}
