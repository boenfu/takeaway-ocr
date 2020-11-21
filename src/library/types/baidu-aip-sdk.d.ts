declare module 'baidu-aip-sdk' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  class ocr {
    generalBasic: any;
    generalBasicUrl: any;
    accurateBasic: any;

    constructor(id: string, key: string, secret: string);
  }

  export {ocr};
}
