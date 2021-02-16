import { memoized, state } from "./direct";

export function resolveProps(defaults) {
  return (props) => {
    const mergedProps = { ...defaults, ...props };
    return Object.fromEntries(
      Object.entries(mergedProps).map(([key, val]) => {
        return [key, typeof val === "function" ? val() : val];
      })
    );
  };
}

export function parseProps(props, defaults = {}) {
  const mergedProps = { ...defaults, ...props };
  return Object.fromEntries(
    Object.entries(mergedProps).map(([key, val]) => {
      const prop =
        typeof val === "function"
          ? val.type !== memoized &&
            val.type !== state &&
            val.type !== "childProp"
            ? val
            : val
          : () => val;
      return [key, prop];
    })
  );
}

export function equal(a, b) {
  const akeys = Object.keys(a);
  if (akeys.length !== Object.keys(b).length) return false;
  return !akeys.some((key) => a[key] !== b[key]);
}

export function serialize(obj) {
  if (Array.isArray(obj)) {
    return (
      "[" +
      obj
        .reduce((ser, it) => {
          ser.push(serialize(it));
          return ser;
        }, [])
        .join(",") +
      "]"
    );
  } else if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj).reduce(
      (str, [key, val]) => str + "#" + key + "=" + serialize(val),
      ""
    );
  } else {
    return "" + obj;
  }
}

export function getDiff(prev, next) {
  const removed = [];
  const kept = [];
  prev.forEach((it) => (next.includes(it) ? kept.push(it) : removed.push(it)));
  const added = next.filter((it) => !kept.includes(it));
  return { removed, added, kept };
}
