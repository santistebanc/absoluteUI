// what if there is a set state insie an auto?

import Memo from "./Memo";
import { debugMemo, equal, parseProps } from "./utils";

function init() {
  const storeMemo = new Map();
  const observers = new Map();
  const memoObservers = new Map();
  let currentAuto = null;
  let context = {};
  let currentMemo = {};

  function store(def) {
    if (typeof def === "undefined") {
      return Object.fromEntries(
        storeMemo.keys().map((key) => [key, state(key)])
      );
    } else if (typeof def === "string") {
      //on read
      currentAuto && currentAuto.addDependency(def);
      const value = storeMemo.get(def);
      currentMemo[def] = value;
      return value;
    } else {
      //on write
      const res = {};
      Object.entries(def).forEach(([key, val]) => {
        storeMemo.set(key, val);
        if (memoObservers.has(key)) {
          memoObservers.get(key).forEach((obs) => {
            obs.run();
          });
          memoObservers.get(key).clear();
        } else {
          memoObservers.set(key, new Set());
        }
        if (observers.has(key)) {
          observers.get(key).forEach((obs) => {
            obs.run();
          });
        } else {
          observers.set(key, new Set());
        }
        res[key] = state(key);
      });
      return res;
    }
  }

  function state(key, initVal) {
    state.type = "state";
    if (initVal) store({ [key]: initVal });
    const res = (newVal) => {
      if (typeof newVal !== "undefined") {
        return store({ [key]: newVal })[key];
      } else {
        return store(key);
      }
    };
    res.type = state;
    return res;
  }

  function auto(func, name) {
    let parentAuto;
    const inst = {
      childAutos: [],
      dependencies: new Set(),
      addDependency: (dep) => {
        if (!inst.dependencies.has(dep)) {
          inst.dependencies.add(dep);
          observers.get(dep).add(inst);
        }
      },
      clearDependencies: () => {
        inst.dependencies.forEach((dep) => {
          observers.get(dep).delete(inst);
        });
        inst.childAutos.forEach((ch) => {
          ch.clearDependencies();
        });
      },
      run: () => {
        inst.childAutos = [];
        // inst.clearDependencies()
        parentAuto = currentAuto;
        if (parentAuto) parentAuto.childAutos.push(inst);
        currentAuto = inst;
        func();
        currentAuto = parentAuto;
      },
    };
    inst.run();
    inst.type = auto;
    return inst;
  }

  function getCurrentDependencies() {
    return Array.from(currentAuto?.dependencies.values());
  }

  function cached(func, { limit } = {}) {
    let last;
    let force = false;
    const memo = Memo({ limit });

    const res = (...args) => {
      //if there are no dependencies output the last value
      if (args.length === 0 && typeof last !== "undefined" && !force)
        return last;

      // return cached value if it exists
      let cachedValue = memo.get(args);
      if (typeof cachedValue !== "undefined" && !force) return cachedValue;

      //if the cache does not exist run the function and cache output
      const output = func(...args);
      last = output;

      memo.set(args, output);
      force = false;
      return output;
    };
    res.forceRun = (...args) => {
      force = true;
      return res(...args);
    };
    res.type = cached;
    return res;
  }

  function Component(template, passedProps = {}) {
    const props = {
      ...template.defaultProps,
      ...parseProps(passedProps),
      ...context,
      ...template.ownProps,
    };

    const bindedOutput = Object.fromEntries(
      Object.entries(template.output).map(([key, val]) => [
        key,
        prop(val).bind(null, props),
      ])
    );
    let output = bindedOutput;
    return {
      ...output,
      props,
      template,
    };
  }

  function prop(func, { limit = 10, name } = {}) {
    let last;
    const deps = [];
    const memo = Memo({ limit });
    
    const res = (...args) => {
      //if there are no dependencies output the last value
      if (deps.length === 0 && typeof last !== "undefined") return last;
      
      //search in memo if there is a cached value for the current state
      if (deps.length > 0) {
        const keys = deps.map((dep) => {
          //pass dependencies to auto
          currentAuto && currentAuto.addDependency(dep);
          //map store values
          return store(dep);
        });
        const cachedValue = memo.get(keys);
        if (typeof cachedValue !== "undefined") return cachedValue;
      }
      
      const parentMemo = { ...currentMemo };
      currentMemo = {};
      const output = func(...args);
      
      Object.keys(currentMemo).forEach((k) => {
        if (!deps.includes(k)) deps.push(k);
      });
      
      if (deps.length) {
        const keys = deps.map((dep) => currentMemo[dep]);
        memo.set(keys, output);
      }
      currentMemo = { ...parentMemo, ...currentMemo };
      last = output;
      return output;
    };
    res.type = prop;
    return res;
  }
  
  function Context(props, child) {
    const setContext = () => {
      context = parseProps(
        typeof props === "function" ? props(context) : { ...context, ...props }
        );
      };
    if (child) {
      setContext();
      return child;
    } else {
      return (child) => {
        setContext();
        return child;
      };
    }
  }

  return {
    store,
    auto,
    state,
    getCurrentDependencies,
    Component,
    Context,
    cached,
    prop,
  };
}

const direct = init();

export default direct;

export const store = direct.store;
export const auto = direct.auto;
export const state = direct.state;
export const getCurrentDependencies = direct.getCurrentDependencies;
export const Context = direct.Context;
export const Component = direct.Component;
export const cached = direct.cached;
export const prop = direct.prop;
