import { Component } from "../direct";
import Template from "../Template";

export const defaultProps = {
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

const BoxTemplate = Template({
  defaultProps,
  childProps,
  output: {
    index: ({ index }) => index(),
    classes: ({ classes }) => classes(),
    children: ({ children }) => children(),
    width: getWidth,
    height: getHeight,
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

export function childProps(props) {
  return (child) => ({
    index: () => props.children().findIndex((ch) => ch === child),
    boundWidth: () => getDimensions(props, child).itemWidth,
    boundHeight: () => getDimensions(props, child).itemHeight,
    boundX: () => getDimensions(props, child).itemX,
    boundY: () => getDimensions(props, child).itemY,
  });
}

export function getDimensions(props, child) {
  const {
    children,
    boundWidth,
    boundHeight,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    gapHorizontal,
    gapVertical,
    width,
    height,
  } = props;

  let startX = paddingLeft();
  let startY = paddingTop();
  let currentHeight = 0;
  let totalWidth = 0;
  let totalHeight = 0;

  const childIndex = children().findIndex((ch) => ch === child);

  if (childIndex > 0) {
    const prevChild = children()[childIndex - 1];
    const {
      itemX,
      itemY,
      itemWidth,
      singleLineHeight,
      containerWidth,
      containerHeight,
    } = getDimensions(props, prevChild);
    startX = itemX + itemWidth + gapHorizontal();
    startY = itemY;
    currentHeight = singleLineHeight;
    totalWidth = containerWidth;
    totalHeight = containerHeight - paddingBottom() - paddingTop();
  }

  const availableWidth =
    (width() ?? boundWidth()) - paddingLeft() - paddingRight();
  const availableHeight =
    (height() ?? boundHeight()) - paddingTop() - paddingBottom();

  const propsToPass = {
    boundHeight: availableHeight,
    boundWidth: availableWidth,
  };
  const childComp = Component(child, propsToPass);
  const calculatedWidth = childComp.width();
  const calculatedHeight = childComp.height();

  if (
    childIndex === 0 ||
    startX + calculatedWidth <= availableWidth + paddingLeft()
  ) {
    return {
      itemX: startX,
      itemY: startY,
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: Math.max(currentHeight, calculatedHeight),
      containerWidth: Math.max(
        totalWidth,
        startX + calculatedWidth + paddingRight()
      ),
      containerHeight: Math.max(
        totalHeight,
        calculatedHeight + paddingTop() + paddingBottom()
      ),
    };
  } else {
    return {
      itemX: paddingLeft(),
      itemY: startY + currentHeight + gapVertical(),
      itemWidth: calculatedWidth,
      itemHeight: calculatedHeight,
      singleLineHeight: calculatedHeight,
      containerWidth: Math.max(
        totalWidth,
        paddingLeft() + availableWidth + paddingRight()
      ),
      containerHeight: Math.max(
        totalHeight,
        totalHeight +
          calculatedHeight +
          gapVertical() +
          paddingTop() +
          paddingBottom()
      ),
    };
  }
}

export function getWidth(props) {
  const { children, width } = props;
  const childrenCount = children().length;
  return (
    width() ??
    (childrenCount
      ? getDimensions(props, children()[childrenCount - 1]).containerWidth
      : 0)
  );
}

export function getHeight(props) {
  const { children, height } = props;
  const childrenCount = children().length;
  return (
    height() ??
    (childrenCount
      ? getDimensions(props, children()[childrenCount - 1]).containerHeight
      : 0)
  );
}

export default Box;
