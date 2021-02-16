// what if there is a set state insie an auto?

import { parseProps } from "./utils";

function init() {
  const storeMemo = new Map();
  const observers = new Map();
  const memoObservers = new Map();
  let currentAuto = null;
  let context = {};
  let trackedStates = new Set();

  function store(def) {
    if (typeof def === "undefined") {
      return Object.fromEntries(
        storeMemo.keys().map((key) => [key, state(key)])
      );
    } else if (typeof def === "string") {
      //on read
      trackedStates.add(def);
      currentAuto && currentAuto.addDependency(def);
      return storeMemo.get(def);
    } else {
      //on write
      console.log("............write state", def);
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
        // console.log(
        //   "auto",
        //   inst.dependencies.size,
        //   inst.childAutos.length,
        //   name
        // );
        // inst.clearDependencies();
        // inst.dependencies.forEach((dep) => {
        //   observers.get(dep).delete(inst);
        // });
        inst.childAutos = [];
        // inst.dependencies.clear()

        //push this auto to the parent auto children list (at this point currentAuto is still the parent auto)
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

  let count = 0;
  function memoized(prop) {
    // console.log("memoized ", prop, count++);
    let memo;
    let invalidated = true;
    const dependencies = new Set();
    const inst = {
      run: () => {
        dependencies.clear();
        invalidated = true;
      },
    };
    const res = () => {
      if (invalidated) {
        invalidated = false;
        const parentAuto = currentAuto;
        currentAuto = {
          addDependency: (dep) => {
            dependencies.add(dep);
            memoObservers.get(dep).add(inst);
          },
        };
        memo = prop();
        currentAuto = parentAuto;
      }
      dependencies.forEach((dep) => {
        currentAuto?.addDependency(dep);
      });
      return memo;
    };
    res.type = memoized;
    return res;
  }

  function getCurrentDependencies() {
    return Array.from(currentAuto?.dependencies.values());
  }

  function cached(func) {
    let memo = {};
    let trackedKeys = [];
    return () => {
      let memoLevel = memo;
      let value;
      for (let i = 0; i < trackedKeys.length; i++) {
        const key = trackedKeys[i];
        memoLevel = memoLevel[key];
        if (!memoLevel) {
          break;
        } else if (memoLevel.value) {
          value = memoLevel.value;
          break;
        }
      }
      if (value) return value;
      trackedStates = new Set(trackedKeys);
      const output = func();
      trackedKeys = [...trackedStates.keys()];

      let level = 0;
      populateTable(memo, trackedKeys);

      function populateTable(table, keys) {
        console.log("........", table, keys, level, trackedKeys.length);
        level++;
        keys.forEach((key) => {
          if (level === trackedKeys.length) {
            table[key] = { ...table[key], value: store(key) };
          }
          let newKeys = [...keys];
          newKeys.splice(newKeys.indexOf(key), 1);

          table[key] = { ...table[key] };
          populateTable(table[key], newKeys);
        });
      }

      return output;
    };
  }

  function Component(template, passedProps = {}) {
    // const parsedPassedProps = Object.values(passedProps).forEach((prop) => {
    //   if (typeof prop === "function") prop.type = "childProp";
    // });
    const props = parseProps({
      ...template.defaultProps,
      ...passedProps,
      ...context,
      ...template.ownProps,
    });
    const overridableOutput = Object.fromEntries(
      Object.entries(template.output).map(([key, val]) => [
        key,
        (unparsedOverrideProps) => {
          const overrideProps = parseProps({
            ...props,
            ...unparsedOverrideProps,
          });
          return val(overrideProps);
        },
      ])
    );
    return {
      ...overridableOutput,
      props,
      template,
    };
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
    memoized,
    getCurrentDependencies,
    Component,
    Context,
    cached,
  };
}

const direct = init();

export default direct;

export const store = direct.store;
export const auto = direct.auto;
export const state = direct.state;
export const memoized = direct.memoized;
export const getCurrentDependencies = direct.getCurrentDependencies;
export const Context = direct.Context;
export const Component = direct.Component;
export const cached = direct.cached;
