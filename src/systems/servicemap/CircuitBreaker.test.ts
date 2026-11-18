import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "./CircuitBreaker";
import { ServiceHealth } from "./ServiceHealth";

const policy = { threshold: 3, openMs: 3000, probesToClose: 2 } as const;

describe("CircuitBreaker", () => {
  it("lets requests through while closed and opens after enough failures in a row", () => {
    const breaker = new CircuitBreaker(policy);
    expect(breaker.admits()).toBe(true);
    expect(breaker.fail(0)).toBeNull();
    expect(breaker.fail(10)).toBeNull();
    expect(breaker.fail(20)).toBe("opened");
    expect(breaker.phase()).toBe("open");
    expect(breaker.admits()).toBe(false);
  });

  it("forgets failures that a success breaks up", () => {
    const breaker = new CircuitBreaker(policy);
    breaker.fail(0);
    breaker.fail(0);
    breaker.pass();
    breaker.fail(0);
    breaker.fail(0);
    expect(breaker.phase()).toBe("closed");
  });

  it("goes half-open after waiting, sends tests, and closes once enough pass", () => {
    const breaker = new CircuitBreaker(policy);
    [0, 0, 0].forEach((at) => breaker.fail(at));
    expect(breaker.update(2999)).toBeNull();
    expect(breaker.update(3000)).toBe("half-opened");
    expect(breaker.probing()).toBe(true);
    expect(breaker.admits()).toBe(false);
    expect(breaker.pass()).toBeNull();
    expect(breaker.pass()).toBe("closed");
    expect(breaker.admits()).toBe(true);
  });

  it("opens again when a test fails, and waits the full time again", () => {
    const breaker = new CircuitBreaker(policy);
    [0, 0, 0].forEach((at) => breaker.fail(at));
    breaker.update(3000);
    expect(breaker.fail(3500)).toBe("opened");
    expect(breaker.update(6000)).toBeNull();
    expect(breaker.update(6500)).toBe("half-opened");
  });

  it("ignores what arrives while it is open", () => {
    const breaker = new CircuitBreaker(policy);
    [0, 0, 0].forEach((at) => breaker.fail(at));
    expect(breaker.fail(100)).toBeNull();
    expect(breaker.pass()).toBeNull();
    expect(breaker.phase()).toBe("open");
  });

  it("refuses a policy that could never open, close or wait", () => {
    expect(() => new CircuitBreaker({ ...policy, threshold: 0 })).toThrow();
    expect(() => new CircuitBreaker({ ...policy, probesToClose: 0 })).toThrow();
    expect(() => new CircuitBreaker({ ...policy, openMs: 0 })).toThrow();
  });
});

describe("ServiceHealth", () => {
  it("goes down, restarts after its time, and is up only once trusted again", () => {
    const health = new ServiceHealth(5000);
    expect(health.takeDown(1000)).toBe(true);
    expect(health.answers()).toBe(false);
    expect(health.update(5999)).toBe(false);
    expect(health.update(6000)).toBe(true);
    expect(health.phase()).toBe("recovering");
    expect(health.answers()).toBe(true);
    expect(health.recover()).toBe(true);
    expect(health.phase()).toBe("up");
  });

  it("cannot be taken down twice, nor recover while up", () => {
    const health = new ServiceHealth(5000);
    expect(health.recover()).toBe(false);
    health.takeDown(0);
    expect(health.takeDown(10)).toBe(false);
    health.update(5000);
    expect(health.takeDown(5000)).toBe(false);
  });
});
