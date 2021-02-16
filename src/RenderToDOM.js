import { auto } from "./direct";

function getStylesString(styles) {
  return Object.entries(styles).reduce(
    (str, [key, val]) => `${str}${key}: ${val};`,
    ""
  );
}

export default function RenderToDOM(base, view) {
  const tree = new Map();
  function mount(component) {
    const {
      index,
      classes,
      text,
      width,
      height,
      x,
      y,
      fontFamily,
      fontSize,
      lineHeight,
    } = component.instance;

    const isText = classes().includes("text");

    const el = document.createElement(isText ? "span" : "div");
    tree.set(component, el);
    let styles = {};
    const tracked = auto(() => {
      styles = {
        ...styles,
        ["opacity"]: `${el.style.opacity}`,
        ["transform"]: `translate(${x()}px,${y()}px)`,
        ["width"]: `${width()}px`,
        ["height"]: `${height()}px`,
      };

      if (isText) {
        styles = {
          ...styles,
          ["font-family"]: fontFamily(),
          ["font-size"]: `${fontSize()}px`,
          ["line-height"]: `${lineHeight()}px`,
        };
      }

      el.style.cssText = getStylesString(styles);

      if (text) el.textContent = text();
    });
    el.style.opacity = "0";
    setTimeout(() => (el.style.opacity = "1"), 0);
    const parentEl = tree.get(component.parent) ?? base;
    parentEl.appendChild(el);
    component.onDetach = () => {
      tracked.clearDependencies();
      tree.delete(component);
      el.style.opacity = "0";
      setTimeout(() => el.parentNode.removeChild(el), 500);
    };
  }

  view.onAttach = (comp) => {
    mount(comp);
  };

  //initial mount
  Array.from(view.components.values()).forEach((comp) => {
    if (comp.attached) {
      mount(comp);
    }
  });
}
