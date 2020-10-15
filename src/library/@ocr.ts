import fs from 'fs';

import {ocr as AipOcrClient} from 'baidu-aip-sdk';

/**
 * 文档链接：https://cloud.baidu.com/doc/OCR/s/Ek3h7ycyg
 */
export class OCR {
  private client: AipOcrClient;

  constructor(id: string, key: string, secret: string) {
    this.client = new AipOcrClient(id, key, secret);
  }

  async get(url: string, retryTimes = 3): Promise<string[]> {
    try {
      const result: any = (await this.request(url)) ?? {};

      if ('error_code' in result) {
        let code!: number;
        let message!: string;

        if (retryTimes > 0) {
          code = result['error_code'];
          message = result['error_msg'];
        } else {
          code = -1;
          message = 'Retries exhausted';
        }

        return this.errorHandler(
          {
            code,
            message,
          },
          url,
          retryTimes,
        );
      }

      return result.words_result?.map(({words}: any) => words);
    } catch (error) {
      // Fix sometime not work
      if (error.code === 'ETIMEDOUT') {
        logger(error);
        return this.errorHandler(error, url, retryTimes);
      }

      return Promise.reject({
        code: error.code,
        message: error.message,
      });
    }
  }

  private async request<TResult>(url: string): Promise<TResult> {
    if (/^https?:\/\/([\w-]+.)+/.test(url)) {
      return this.client.generalBasicUrl(url);
    }

    let image = loadLocalImage(url);

    return this.client.generalBasic(image);
  }

  private async errorHandler(
    {
      code,
      message,
    }: {
      code: number;
      message: string;
    },
    url: string,
    times: number,
  ): Promise<any> {
    // qps limit
    if (code === 18) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.get(url, times - 1));
        }, 500);
      });
    }

    // 17: Open api daily request limit reached
    // 19: Open api total request limit reached
    if (code === 17 || code === 19) {
      logger({code, message});
    }

    return Promise.reject({
      code,
      message,
    });
  }
}

function loadLocalImage(imagePath: string): string {
  return fs.readFileSync(imagePath).toString('base64');
}

function logger(error: any): void {
  // eslint-disable-next-line no-console
  console.log(`[${Date.now().toString()}]`, error);
}
