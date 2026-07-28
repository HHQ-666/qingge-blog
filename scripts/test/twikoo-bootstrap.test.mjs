import assert from "node:assert/strict";
import test from "node:test";
import {
  claimMount,
  isCurrentMount,
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
