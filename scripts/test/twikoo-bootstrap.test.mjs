import assert from "node:assert/strict";
import test from "node:test";
import {
  claimMount,
  isCurrentMount,
  loadTwikoo,
} from "../../src/scripts/twikoo-bootstrap.mjs";

test("新挂载使旧异步回调失效", () => {
  const host = { dataset: {}, isConnected: true };

  const first = claimMount(host);
  const second = claimMount(host);

  assert.equal(isCurrentMount(host, first), false);
  assert.equal(isCurrentMount(host, second), true);
});

test("已离开页面的宿主不得初始化", () => {
  const host = { dataset: {}, isConnected: true };
  const token = claimMount(host);

  host.isConnected = false;

  assert.equal(isCurrentMount(host, token), false);
});

test("快速重复挂载时复用同一份 Twikoo 脚本加载任务", async () => {
  const windowRef = {};
  let appended = 0;
  let script;
  const documentRef = {
    defaultView: windowRef,
    createElement() {
      script = { dataset: {} };
      return script;
    },
    querySelector() {
      return null;
    },
    head: {
      appendChild() {
        appended += 1;
      },
    },
  };

  const first = loadTwikoo(documentRef);
  const second = loadTwikoo(documentRef);

  assert.strictEqual(first, second);
  assert.equal(appended, 1);

  windowRef.twikoo = { init() {} };
  script.onload();
  assert.strictEqual(await first, windowRef.twikoo);
});

test("脚本失败后移除旧标签，下一次可重新加载", async () => {
  const windowRef = {};
  let appended = 0;
  let currentScript = null;
  const documentRef = {
    defaultView: windowRef,
    createElement() {
      const script = {
        dataset: {},
        remove() {
          if (currentScript === script) currentScript = null;
        },
      };
      return script;
    },
    querySelector() {
      return currentScript;
    },
    head: {
      appendChild(script) {
        appended += 1;
        currentScript = script;
      },
    },
  };

  const failed = loadTwikoo(documentRef);
  currentScript.onerror();
  await assert.rejects(failed, /failed to load/);
  assert.equal(currentScript, null);

  const retried = loadTwikoo(documentRef);
  assert.equal(appended, 2);
  windowRef.twikoo = { init() {} };
  currentScript.onload();
  assert.strictEqual(await retried, windowRef.twikoo);
});
