# takeaway-ocr

解析外卖订单截图

## Example

```ts
import {TakeawayOCR} from 'takeaway-ocr';
import path from 'path';

const takeaway = new TakeawayOCR('app_id', 'app_key', 'secret_key');

// local file
const getPath = str => path.join(__dirname, '../../images', str);

takeaway.match(['./p1.jpg', './p1.jpg'].map(getPath)).then(console.log);

// remote file
takeaway
  .match(['https://a.b.c/1.jpg', 'https://a.b.c/2.png'], false)
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
