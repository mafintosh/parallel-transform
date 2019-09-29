import { Transform, TransformOptions, WritableOptions } from "readable-stream";
// import util from "util";
import cyclist, { Cyclist } from "cyclist";
// import inherits from "inherits";

type ParallelTransformOpitons = TransformOptions & {
  ordered?: boolean,
};

type OnTransformFn = (data: any, callback: (error?: Error, data?: any) => void) => void;

export class ParallelTransform extends Transform {
  private _destroyed: boolean;
  private _maxParallel: number;
  private _ontransform: OnTransformFn;
  private _flushed: boolean;
  private _ordered: boolean;
  private _buffer: Cyclist<any> | Array<any>;
  private _top: number;
  private _bottom: number;
  private _ondrain: null | Function;

  constructor(
      maxParallel: number,
      opts: ParallelTransformOpitons,
      ontransform: OnTransformFn,
  ) {
    if (opts.objectMode !== false) {
      opts.objectMode = true;
      opts.objectMode = true;
    }
    if (!opts.highWaterMark) opts.highWaterMark = Math.max(maxParallel, 16);

    super(opts);

    this._destroyed = false;
    this._maxParallel = maxParallel;
    this._ontransform = ontransform;
    this._flushed = false;
    this._ordered = opts.ordered !== false;
    this._buffer = this._ordered ? cyclist(maxParallel) : [];
    this._top = 0;
    this._bottom = 0;
    this._ondrain = null;
  }

  destroy(err?: Error | undefined, callback?: ((error: Error | null) => void) | undefined): this {
    if (this._destroyed) return this;
    this._destroyed = true;
    this.emit('close');
    return this;
  };

  _transform(chunk: any, encoding: string, callback: (error?: Error, data?: any) => void): void {
    const pos = this._top++;

    this._ontransform(chunk, (err, data) => {
      if (this._destroyed) return;
      if (err) {
        this.emit('error', err);
        this.push(null);
        this.destroy();
        return;
      }
      if (Array.isArray(this._buffer)) {
        this._buffer.push(data);
      } else {
        this._buffer.put(pos, (data === undefined || data === null) ? null : data);
      }
      this._drain();
    });

    if (this._top - this._bottom < this._maxParallel) return callback();
    this._ondrain = callback;
  }

  _flush(callback) {
    this._flushed = true;
    this._ondrain = callback;
    this._drain();
  }

  _drain() {
    if (Array.isArray(this._buffer)) {
      while (this._buffer.length > 0) {
        const popped = this._buffer.pop();
        this._bottom++;
        if (popped === null) continue;
        this.push(popped);
      }
    } else {
      while (this._buffer.get(this._bottom) !== undefined) {
        const deleted = this._buffer.del(this._bottom++);
        if (deleted === null) continue;
        this.push(deleted);
      }
    }

    if (!this._drained() || !this._ondrain) return;

    const ondrain = this._ondrain;
    this._ondrain = null;
    ondrain();
  };

  _drained() {
    const diff = this._top - this._bottom;
    return this._flushed ? !diff : diff < this._maxParallel;
  }
}

export default function transform(
    maxParallel: number | ParallelTransformOpitons | OnTransformFn,
    opts?: ParallelTransformOpitons | OnTransformFn,
    ontransform?: OnTransformFn,
) {
  if (typeof maxParallel === 'function') {
    return new ParallelTransform(1, {}, maxParallel as OnTransformFn);
  }
  if (typeof opts === 'function') {
    return new ParallelTransform(maxParallel as number, {}, opts as OnTransformFn);
  }
  if (typeof ontransform === 'function') {
    return new ParallelTransform(maxParallel as number, opts as ParallelTransformOpitons, ontransform);
  }
  throw new Error('Wrong arugment passed');
}
