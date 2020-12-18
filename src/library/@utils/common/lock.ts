import * as v from 'villa';

export function lock(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  // eslint-disable-next-line @typescript-eslint/ban-types
  let fn: Function = target[propertyKey];

  descriptor.value = async function (...args: any[]) {
    return v.lock(target.name, fn.bind(this, ...args));
  };
}
