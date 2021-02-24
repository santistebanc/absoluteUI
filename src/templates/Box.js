import { cached, Component, prop } from "../direct";
import Template from "../Template";

export const defaultProps = {
  name: "",
  index: -1,
  classes: ["box"],
  children: [],
  paddingLeft: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  gapHorizontal: 0,
  gapVertical: 0,
  width: null,
  height: null,
  boundHeight: Infinity,
  boundWidth: Infinity,
  boundX: 0,
  boundY: 0,
};

export const getDimensions = (child, props) => {
  const resolveProps = Object.fromEntries(
    Object.entries(props).map(([k, v]) => [k, v()])
  );
  const {
    boundWidth,
    boundHeight,
    children,
    width,
    height,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    gapHorizontal,
    gapVertical,
  } = resolveProps;
  
  let startX = paddingLeft;
  let startY = paddingTop;
  let currentHeight = 0;
  let totalWidth = 0;
  let totalHeight = 0;
  
  const childIndex = children.findIndex((ch) => ch === child);

  if (childIndex > 0) {
    const prevChild = children[childIndex - 1];
    const {
      itemX,
      itemY,
      itemWidth,
      singleLineHeight,
      containerWidth,
      containerHeight,
    } = getDimensions(prevChild, props);

    startX = itemX + itemWidth + gapHorizontal;
    startY = itemY;
    currentHeight = singleLineHeight;
    totalWidth = containerWidth;
    totalHeight = containerHeight - paddingBottom - paddingTop;
  }

  const availableWidth = (width ?? boundWidth) - paddingLeft - paddingRight;
  const availableHeight = (height ?? boundHeight) - paddingTop - paddingBottom;

  const propsToPass = {
    boundHeight: availableHeight,
    boundWidth: availableWidth,
  };
  const childComp = Component(child, propsToPass);
  const calculatedWidth = childComp.width();
  const calculatedHeight = childComp.height();

  if (
    childIndex === 0 ||
    startX + calculatedWidth <= availableWidth + paddingLeft
  ) {
    return {
      itemX: startX,
      itemY: startY,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: Math.max(currentHeight, calculatedHeight),
      containerWidth: Math.max(
        totalWidth,
        startX + calculatedWidth + paddingRight
      ),
      containerHeight: Math.max(
        totalHeight,
        totalHeight -
          currentHeight +
          Math.max(currentHeight, calculatedHeight) +
          paddingTop +
          paddingBottom
      ),
    };
  } else {
    return {
      itemX: paddingLeft,
      itemY: startY + currentHeight + gapVertical,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: calculatedHeight,
      containerWidth: Math.max(
        totalWidth,
        paddingLeft + availableWidth + paddingRight
      ),
      containerHeight: Math.max(
        totalHeight,
        totalHeight +
          calculatedHeight +
          gapVertical +
          paddingTop +
          paddingBottom
      ),
    };
  }
};

export const getWidth = (props) => {
  const children = props.children();
  const childrenCount = children.length;
  return (
    props.width() ??
    (childrenCount
      ? getDimensions(children[childrenCount - 1], props).containerWidth
      : 0)
  );
};

export const getHeight = (props) => {
  const children = props.children();
  const childrenCount = children.length;
  return (
    props.height() ??
    (childrenCount
      ? getDimensions(children[childrenCount - 1], props).containerHeight
      : 0)
  );
};

export function childProps(props) {
  return (child) => ({
    index: () => props.children().findIndex((ch) => ch === child),
    boundWidth: () => getDimensions(child, props).itemWidth,
    boundHeight: () => getDimensions(child, props).itemHeight,
    boundX: () => getDimensions(child, props).itemX,
    boundY: () => getDimensions(child, props).itemY,
  });
}

const BoxTemplate = Template({
  defaultProps,
  childProps,
  output: {
    name: ({ name }) => name(),
    index: ({ index }) => index(),
    classes: ({ classes }) => classes(),
    children: ({ children }) => children(),
    width: (props) => getWidth(props),
    height: (props) => getHeight(props),
    x: ({ boundX }) => boundX(),
    y: ({ boundY }) => boundY(),
  },
});

function Box(...args) {
  const ensureArray = (obj) => {
    if (typeof obj === "function") {
      return () => {
        const res = obj();
        return Array.isArray(res) ? res : [res];
      };
    } else {
      return Array.isArray(obj) ? obj : [obj];
    }
  };
  const parsedArgs =
    !args[0].render && args[0].children
      ? ensureArray(args[0])
      : { children: ensureArray(args[0]), ...args[1] };
  return BoxTemplate(parsedArgs, args[2]);
}

export default Box;
