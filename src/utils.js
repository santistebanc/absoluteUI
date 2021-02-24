import { prop, state } from "./direct";

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

export function parseProps(props) {
  return Object.fromEntries(
    Object.entries(props).map(([key, val]) => {
      let res;
      if (typeof val === "function") {
        if (val.type === state || val.type === prop) {
          res = val;
        } else {
          res = prop(val, { name: props.name });
        }
      } else {
        res = () => val;
      }
      return [key, res];
    })
  );
}

export function equal(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return !a.some((v) => !b.includes(v));
  }
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

export function debugMemo(memo) {
  if (!memo.size) return memo.toString();
  return [...memo.keys()].reduce(
    (str, k, i, arr) =>
      str +
      `(${k?.name?.call() ?? k})->` +
      debugMemo(memo.get(k)) +
      (i < arr.length - 1 ? ", \n" : ""),
    ""
  );
}
