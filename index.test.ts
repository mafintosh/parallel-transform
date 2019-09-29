import assert from 'assert';
import { pipeline, Readable, Transform } from 'readable-stream';
// @ts-ignore
import transform from './index';

test('', async () => {
  const source = [ 2, 3, 4, 5, 6 ];
  const expected = 6;
  let actual;

  await new Promise((resolve, reject) => {
    const readable = new Readable({
      objectMode: true,
      read(size: number): void {
        for (let n of source) this.push(n);
        this.push(null);
      }
    });
    pipeline(
        readable,
        new Transform({
          writableObjectMode: true,
          transform(n: number, _: string, callback: (error?: Error, data?: any) => void): void {
            actual = n;
            callback();
          }
        }),
        (err) => {
          if (err) return reject(err);
          resolve();
        }
    );
  });

  assert.deepStrictEqual(actual, expected);
}, 10 * 1000);