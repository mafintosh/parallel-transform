declare module 'cyclist' {
  export interface Cyclist<T> {
    put(index: number, value: any): void;
    get(index: number): T | void;
    pop(): T | undefined;
    del(index: number): void;
    length: number;
  }

  export default function cyclist<T = any>(size: number): Cyclist<T>
}