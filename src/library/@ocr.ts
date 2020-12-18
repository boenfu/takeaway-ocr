import fs from 'fs';
import http from 'http';

import {ocr as AipOcrClient} from 'baidu-aip-sdk';

import {logger, qps} from './@utils';

export interface OCRGetOptions {
  type: 'general' | 'accurate';
  retryTimes?: number;
}

/**
 * 文档链接：https://cloud.baidu.com/doc/OCR/s/Ek3h7ycyg
 */
export class OCR {
  private client: AipOcrClient;

  constructor(id: string, key: string, secret: string, readonly qps: number) {
    this.client = new AipOcrClient(id, key, secret);
  }

  async get(
    url: string,
    {type, retryTimes = 3}: OCRGetOptions,
  ): Promise<string[]> {
    try {
      const result: any = (await this[type](url)) ?? {};

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
          {type, retryTimes},
        );
      }

      return result.words_result?.map(({words}: any) => words);
    } catch (error) {
      // Fix sometime not work
      if (error.code === 'ETIMEDOUT') {
        logger(error);
        return this.errorHandler(error, url, {type, retryTimes});
      }

      return Promise.reject({
        code: error.code,
        message: error.message,
      });
    }
  }

  @qps('ocr-general')
  private async general<TResult>(url: string): Promise<TResult> {
    if (/^https?:\/\/([\w-]+.)+/.test(url)) {
      return this.client.generalBasicUrl(url);
    }

    let image = loadLocalImage(url);

    return this.client.generalBasic(image);
  }

  @qps('ocr-accurate')
  private async accurate<TResult>(url: string): Promise<TResult> {
    let image = /^https?:\/\/([\w-]+.)+/.test(url)
      ? await loadRemoteImage(url)
      : loadLocalImage(url);

    return this.client.accurateBasic(image);
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
    {type, retryTimes}: Required<OCRGetOptions>,
  ): Promise<any> {
    // qps limit
    if (code === 18) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(
            this.get(url, {
              type,
              retryTimes: retryTimes - 1,
            }),
          );
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

function loadRemoteImage(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    http.get(imagePath, function (res) {
      let chunks: any[] = [];
      let size = 0;

      res.on('data', function (chunk) {
        chunks.push(chunk);
        size += chunk.length;
      });
      res.on('end', function (error: Error) {
        if (error) {
          reject(error);
          return;
        }

        resolve(Buffer.concat(chunks, size).toString('base64'));
      });
    });
  });
}
