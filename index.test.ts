import assert from 'assert';
import { pipeline, Readable, Transform } from 'readable-stream';
// @ts-ignore
import transform from './index';

describe('transform', () => {
  it('should emit pipeline callback with sync function', async () => {
    const expected = [ 2, 3, 4, 5, 6 ];
    const actual: number[] = [];

    await new Promise((resolve, reject) => {
      const readable = new Readable({
        objectMode: true,
        read(size: number): void {
          for (let n of expected) this.push(n);
          this.push(null);
        }
      });
      pipeline(
          readable,
          transform(10, function(n, callback) {
              actual.push(n);
              callback();
          }),
          (err) => {
            if (err) return reject(err);
            resolve();
          }
      );
    });

    assert.deepStrictEqual(actual, expected);
  }, 10 * 1000);

  it.skip('should emit pipeline callback with async function', async () => {
    const expected = [ 2, 3, 4, 5, 6 ];
    const actual: number[] = [];

    await new Promise((resolve, reject) => {
      const readable = new Readable({
        objectMode: true,
        read(size: number): void {
          for (let n of expected) this.push(n);
          this.push(null);
        }
      });
      pipeline(
          readable,
          transform(10, function(n, callback) {
            setTimeout(() => {
              actual.push(n);
              callback();
            }, n);
          }),
          (err) => {
            if (err) return reject(err);
            resolve();
          }
      );
    });

    assert.deepStrictEqual(actual, expected);
  }, 10 * 1000);

  it('should run in parallel', async () => {
    const acceptableOffset = 200;
    const tookExpected = 1000 + acceptableOffset;
    const expectedArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const actualArray: number[] = [];
    let tookActual: number;

    await new Promise(resolve => {
      const start = Date.now();
      const stream = transform(10, function (data, callback) { // 10 is the parallism level
        setTimeout(function () {
          callback(undefined, data);
        }, 1000);
      });

      for (let i = 0; i < 10; i++) {
        stream.write(i);
      }
      stream.end();

      stream.on('data', function (data: number) {
        actualArray.push(data);
      });
      stream.on('end', function () {
        tookActual = Date.now() - start;
        resolve();
      });
    });

    // @ts-ignore
    let wasInParallel = tookActual < tookExpected;
    assert(wasInParallel);
    assert.deepStrictEqual(actualArray, expectedArray);
  }, 10 * 1000);

})
