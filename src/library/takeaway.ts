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

export type TakeawayField = keyof Takeaway;

export interface TakeawayOCROptions {
  /**
   * 使用高精度匹配，默认 false
   */
  accurate?: boolean;
  /**
   * 信息匹配未完全时，重新使用高精度，默认 true
   */
  fallbackAccurate?: boolean;
  fields?: TakeawayField[];
}

const CHECKER_DICT: {[key in TakeawayField]: TakeawayChecker} = {
  type: checkType,
  shop: checkShop,
  order_id: checkOrderId,
  order_date: checkOrderDate,
  amount: checkAmount,
  comment: checkComment,
  score: checkScore,
};

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
      fields: [],
      ...options,
    };
  }

  @lock
  async match(
    urls: string[],
    options: TakeawayOCROptions = {},
  ): Promise<Takeaway | undefined> {
    let {
      accurate = this.options.accurate,
      fallbackAccurate = this.options.fallbackAccurate,
      fields,
    } = options;

    const defaultTakeaway: Takeaway = fields?.length
      ? fields.reduce<Takeaway>((takeaway, field) => {
          takeaway[field] = undefined;
          return takeaway;
        }, {})
      : {
          type: undefined,
          shop: undefined,
          order_id: undefined,
          order_date: undefined,
          amount: undefined,
          comment: undefined,
          score: undefined,
        };

    const defaultCheckers = Object.keys(defaultTakeaway).map(
      (field: TakeawayField) => CHECKER_DICT[field],
    );

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

    while (true) {
      nextCheckers = [];

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

          runCheckers(word, [...checkers, ...defaultCheckers]);
        }
      }

      if (!isComplete(defaultTakeaway) && !accurate && fallbackAccurate) {
        accurate = true;
        fallbackAccurate = false;
      } else {
        return defaultTakeaway;
      }
    }
  }
}

// utils

function isComplete(takeaway: Takeaway): takeaway is Required<Takeaway> {
  return Array.from(Object.values(takeaway)).every(
    value => value !== undefined,
  );
}
