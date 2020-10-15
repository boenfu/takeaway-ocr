# takeaway-ocr

解析(美团/饿了么)外卖订单截图

## Example

```ts
import {TakeawayOCR} from 'takeaway-ocr';

const takeaway = new TakeawayOCR('app_id', 'app_key', 'secret_key');

takeaway
  .match([
    // local file
    require('path').join(__dirname, '../../images/1.jpg'),
    // remote url
    'https://a.b.c/2.jpg',
  ])
  .then(console.log);
```

```ts
// result json
interface Takeaway {
  type?: 'meituan' | 'ele';
  shop?: string;
  order_id?: string;
  order_date?: string;
  amount?: number;
  comment?: string;
  score?: number;
}
```

## License

MIT License.
