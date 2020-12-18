const qpsMap = new Map<string, Promise<number>>();

export function qps(key: string): any {
  return (
    target: any,
    propertyKey: string,
    descriptors: PropertyDescriptor,
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    let fn: Function = target[propertyKey];

    descriptors.value = async function (
      this: any,
      ...args: any[]
    ): Promise<any> {
      if (!('qps' in this)) {
        return;
      }

      let current = (await qpsMap.get(key)) || 1;

      qpsMap.set(
        key,
        current < this.qps
          ? Promise.resolve(current + 1)
          : new Promise(resolve => setTimeout(() => resolve(1), 1000)),
      );

      return fn.call(this, ...args);
    };
  };
}
