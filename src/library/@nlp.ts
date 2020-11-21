import {nlp as AipNlpClient} from 'baidu-aip-sdk';

import {logger} from './@utils';

/**
 * 自然语言处理
 */
export class NLP {
  private client: AipNlpClient;

  constructor(id: string, key: string, secret: string) {
    this.client = new AipNlpClient(id, key, secret);
  }

  async simnet(text1: string, text2: string): Promise<number> {
    try {
      let {score} = await this.client.simnet(text1, text2);

      return score;
    } catch (error) {
      logger(error);
      return 0;
    }
  }
}
