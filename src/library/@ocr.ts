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

  async get(url: string, remote: boolean): Promise<string[]> {
    try {
      const result: any = await this.request(url, remote);

      return result?.words_result?.map(({words}: any) => words);
    } catch (error) {
      return [];
    }
  }

  private async request<TResult>(
    url: string,
    remote: boolean,
  ): Promise<TResult> {
    if (remote) {
      return this.client.generalBasicUrl(url);
    }

    let image = loadLocalImage(url);

    return this.client.generalBasic(image);
  }
}

function loadLocalImage(imagePath: string): string {
  return fs.readFileSync(imagePath).toString('base64');
}
