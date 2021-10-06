import { ScopeOffsets } from "../common/types";
import {
  Scope,
  runWithScope,
  currentScope,
  currentOffset,
  write,
  getOwnerScope,
  ownerOffset
} from "./scope";

type ExecFn = (scope: Scope, offset: number) => void;

const { port1, port2 } = new MessageChannel();
let queued: boolean;

port1.onmessage = () => {
  queued = false;
  run();
};

function flushAndWaitFrame() {
  run();
  requestAnimationFrame(triggerMacroTask);
}

function triggerMacroTask() {
  port2.postMessage(0);
}

let queuedFns: unknown[] = [];
// [fn, scope, offset, sourceCount]

export function queue(
  fn: ExecFn,
  localIndex = 0,
  scope = currentScope,
  offset = currentOffset
) {
  const index = findQueueIndex(scope, offset + localIndex);

  // index is where the function should be in the queue
  // but if it already exists, we should not add it again
  if (
    queuedFns[index] !== fn ||
    queuedFns[index + 1] !== scope ||
    queuedFns[index + 2] !== offset
  ) {
    if (!queued) {
      queued = true;
      queueMicrotask(flushAndWaitFrame);
    }

    for (let i = queuedFns.length - 1; i >= index; i--) {
      queuedFns[i + 4] = queuedFns[i];
    }

    queuedFns[index] = fn;
    queuedFns[index + 1] = scope;
    queuedFns[index + 2] = offset;
    queuedFns[index + 3] = offset + localIndex;
  }
}

export function queueInOwner(
  fn: ExecFn,
  sourceCount?: number,
  ownerLevel?: number
) {
  queue(fn, sourceCount, getOwnerScope(ownerLevel), ownerOffset);
}

let queuedValues: unknown[] = [];
export function setQueued(scope: Scope, index: number, value: unknown) {
  // TODO: if the same index is set twice for a scope,
  // the first one should be removed from the queue
  queuedValues.push(scope, index, value);
}

export function run() {
  if (queuedFns.length) {
    const runningFns = queuedFns;
    const runningValues = queuedValues;
    queuedFns = [];
    queuedValues = [];
    for (let i = 0; i < runningValues.length; i += 3) {
      write(
        0,
        runningValues[i + 2] as unknown,
        runningValues[i] as Scope,
        runningValues[i + 1] as number
      );
    }
    for (let i = 0; i < runningFns.length; i += 4) {
      runWithScope(
        runningFns[i] as ExecFn,
        runningFns[i + 2] as number,
        runningFns[i + 1] as Scope
      );
    }
  }
}

function findQueueIndex(scope: Scope, offset: number) {
  let index = 0;
  let max = queuedFns.length >>> 2;

  while (index < max) {
    const mid = (index + max) >>> 1;
    const compareResult = compareQueue(mid * 4, scope, offset);
    if (compareResult > 0) {
      max = mid;
    } else if (compareResult < 0) {
      index = mid + 1;
    } else {
      return mid * 4;
    }
  }

  return index * 4;
}

function compareQueue(index: number, scope: Scope, offset: number) {
  return (
    compare(
      (queuedFns[index + 1] as Scope)[ScopeOffsets.ID],
      scope[ScopeOffsets.ID]
    ) || (queuedFns[index + 3] as number) - offset
  );
}

function compare(a: number | string, b: number | string) {
  return a < b ? -1 : a > b ? 1 : 0;
}
