import * as v from 'villa';

import {NLP} from './@nlp';
import {OCR} from './@ocr';
import {
  checkAmount,
  checkComment,
  checkExtraText,
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

export interface Takeaway {
  type?: 'meituan' | 'ele';
  shop?: string;
  order_id?: string;
  order_date?: string;
  amount?: number;
  comment?: string;
  score?: number;
  extraTexts?: boolean[];
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
  /**
   * 需要匹配的字段，长度大于 0 时生效
   */
  fields?: TakeawayField[];
  /**
   * 对店铺名进行自然语言比对，需开通这个服务
   */
  shopName?: string;
  /**
   * 最低置信度: 0-1
   * 默认值 0.9
   */
  shopNameLimitScore?: number;
  /**
   * 额外需要匹配的文本，将返回 boolean 数组
   */
  extraTexts?: string[];
}

interface TakeawayCheckerContext extends TakeawayOCROptions {
  nlp?: NLP;
}

export type TakeawayChecker = (
  takeaway: Takeaway,
  word: string,
  context: TakeawayCheckerContext,
) => TakeawayChecker | true | void | Promise<TakeawayChecker | true | void>;

const CHECKER_DICT: {[key in TakeawayField]: TakeawayChecker} = {
  type: checkType,
  shop: checkShop,
  order_id: checkOrderId,
  order_date: checkOrderDate,
  amount: checkAmount,
  comment: checkComment,
  score: checkScore,
  extraTexts: checkExtraText,
};

export class TakeawayOCR {
  private ocr: OCR;
  private nlp?: NLP;
  private options: Required<TakeawayOCROptions>;

  constructor(
    private id: string,
    private key: string,
    private secret: string,
    options?: TakeawayOCROptions,
  ) {
    this.ocr = new OCR(id, key, secret);

    this.options = {
      accurate: false,
      fallbackAccurate: true,
      fields: [],
      shopName: '',
      shopNameLimitScore: 0.9,
      extraTexts: [],
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
      shopName = this.options.shopName,
      extraTexts = this.options.extraTexts,
    } = options;

    if (shopName && !this.nlp) {
      this.nlp = new NLP(this.id, this.key, this.secret);
    }

    const defaultExtraTexts = extraTexts?.length
      ? extraTexts.map(() => false)
      : undefined;
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

    if (defaultExtraTexts) {
      defaultTakeaway.extraTexts = defaultExtraTexts;
    }

    const defaultCheckers = Object.keys(defaultTakeaway).map(
      (field: TakeawayField) => CHECKER_DICT[field],
    );

    const checkerContext: TakeawayCheckerContext = {
      ...this.options,
      ...options,
      nlp: this.nlp,
    };

    let nextCheckers: TakeawayChecker[] = [];

    let runCheckers = (word: string, checkers: TakeawayChecker[]): void => {
      for (let checker of checkers) {
        let result = checker(defaultTakeaway, word, checkerContext);

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
