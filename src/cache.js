currentMemo.save(key, value);

let currentMemo;

function cached(func) {
  const trackedKeys = new Set();
  const memo = new Map();
  return () => {
    //search in memo if there is a cached value for the current state
    let memoIter = memo;
    for (let i = 0; i < trackedKeys.size; i++) {
      const next = memoIter.get(trackedKeys[i]);
      if (!next) break;
      memoIter = next;
    }
    //return cached value if it exists
    if (memoIter.get("value")) return memoIter.value;

    //if the cache does not exist run the function and save any state reads to cache
    currentMemo = {
      save: (key, value) => {
        trackedKeys.add(key);
        setMemo(memo, 0);

        function setMemo(memoMap, lvl) {
          if (lvl === trackedKeys.size) {
            memoMap.set("value", value);
          }
          lvl++;
          [...memoMap.values()].forEach((m) => {
            const newMap = new Map(m);
            m.set(key, newMap);
            setMemo(newMap.get(key), lvl);
          });
          const newMap = new Map(memoMap);
          memoMap.set(key, newMap);
          setMemo(newMap.get(key), lvl);
        }
      },
    };

    return func(...arguments);
  };
}
