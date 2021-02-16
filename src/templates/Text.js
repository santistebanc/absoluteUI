import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "../constants";
import Template from "../Template";

export const defaultProps = {
  index: -1,
  classes: ["text"],
  text: "",
  fontSize: DEFAULT_FONT_SIZE,
  lineHeight: DEFAULT_LINE_HEIGHT,
  boundHeight: Infinity,
  boundWidth: Infinity,
  boundX: 0,
  boundY: 0,
  font: null,
};

const TextTemplate = Template({
  defaultProps,
  output: {
    index: ({ index }) => index(),
    classes: ({ classes }) => classes(),
    text: ({ text }) => text(),
    fontFamily: ({ font }) => font()?.names.fontFamily.en ?? "Courier New",
    fontSize: ({ fontSize }) => fontSize(),
    lineHeight: ({ lineHeight }) => lineHeight(),
    width: getWidth,
    height: getHeight,
    x: ({ boundX }) => boundX(),
    y: ({ boundY }) => boundY(),
  },
});

function Text(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return TextTemplate(parsedArgs, args[2]);
}

export function getStringWidth({ text, fontSize, font }) {
  return (
    font()?.getAdvanceWidth(text(), fontSize()) ||
    (text().length * fontSize() * 1229) / 2048
  );
}

export function getLines(props) {
  const { text, fontSize, font } = props;
  const words = text().split(" ");
  const lines = [];
  let line = words[0];
  words.slice(1).forEach((word) => {
    const newLine = line.concat(" " + word);
    if (
      getStringWidth({ text: () => newLine, fontSize, font }) <=
      getMaxWidth(props)
    ) {
      line = newLine;
    } else {
      lines.push(line);
      line = word;
    }
  });
  lines.push(line);
  return lines;
}

export function getWidth(props) {
  const { boundWidth } = props;
  if (getLines(props).length > 1) return boundWidth();
  return getMaxWidth(props);
}

export function getHeight(props) {
  const { lineHeight } = props;
  const linesCount = getLines(props).length;
  return linesCount * lineHeight();
}

export function getMaxWidth(props) {
  const { boundWidth } = props;
  return Math.min(boundWidth(), getStringWidth(props));
}

export default Text;
