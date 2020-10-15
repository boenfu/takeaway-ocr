import * as v from 'villa';

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

function lock(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let fn: Function = target[propertyKey];

  descriptor.value = async function (...args: any[]) {
    return v.lock(TakeawayOCR.name, fn.bind(this, ...args));
  };
}

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

export interface TakeawayOCROptions {
  /**
   * 使用高精度匹配，默认 false
   */
  accurate?: boolean;
  /**
   * 信息匹配完全时，重新使用高精度，默认 true
   */
  fallbackAccurate?: boolean;
}

export class TakeawayOCR {
  private ocr: OCR;
  private options: Required<TakeawayOCROptions>;

  constructor(
    id: string,
    key: string,
    secret: string,
    options?: TakeawayOCROptions,
  ) {
    this.ocr = new OCR(id, key, secret);

    this.options = {
      accurate: false,
      fallbackAccurate: true,
      ...options,
    };
  }

  @lock
  async match(
    urls: string[],
    accurate = this.options.accurate,
    fallbackAccurate = this.options.fallbackAccurate,
  ): Promise<Takeaway | undefined> {
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

      let words = await this.ocr.get(url, {
        type: accurate ? 'accurate' : 'general',
      });

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

    if (!isComplete(defaultTakeaway) && !accurate && fallbackAccurate) {
      return this.match(urls, true, false);
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
