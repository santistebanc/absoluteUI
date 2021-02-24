import { DEFAULT_FONT_SIZE, DEFAULT_LINE_HEIGHT } from "../constants";
import { cached } from "../direct";
import Template from "../Template";

export const defaultProps = {
  name: "",
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

export const getCharWidth = cached((char, fontSize, font) => {
  return font?.getAdvanceWidth(char, fontSize) || (fontSize * 1229) / 2048;
});

export const getStringWidth = cached((text, fontSize, font) => {
  return font
    ? text
        .split("")
        .reduce((sum, char) => sum + getCharWidth(char, fontSize, font), 0)
    : (text.length * fontSize * 1229) / 2048;
});

export const getWords = cached((text, fontSize, font) => {
  const spaceWidth = getStringWidth(" ", fontSize, font);
  let widthSoFar = 0;
  return text.split(" ").map((wordText, i) => {
    const wordWidth = getStringWidth(wordText, fontSize, font);
    widthSoFar += wordWidth + (i > 0 ? spaceWidth : 0);
    return [wordText, wordWidth, widthSoFar];
  });
});

export const getMaxWidth = cached((boundWidth, text, fontSize, font) => {
  const words = getWords(text, fontSize, font);
  return Math.min(boundWidth, words[words.length - 1][2]);
});

export const getLines = cached((boundWidth, text, fontSize, font) => {
  const spaceWidth = getStringWidth(" ", fontSize, font);
  const availableWidth = getMaxWidth(boundWidth, text, fontSize, font);
  const words = getWords(text, fontSize, font);
  const totalWidth = words[words.length - 1][2];
  const aproxCutPoint = Math.ceil((words.length * availableWidth) / totalWidth);

  let lines = 0;
  let pointerIdx = 0;
  let usedWidth = 0;
  do {
    lines++;
    pointerIdx = findCutIndex(
      availableWidth + usedWidth + (lines > 1 ? spaceWidth : 0),
      pointerIdx + aproxCutPoint
    );
    if (pointerIdx < words.length) {
      usedWidth = words[pointerIdx][2];
    }
  } while (pointerIdx < words.length - 1);

  function findCutIndex(limitWidth, idx, discarded) {
    if (limitWidth > words[words.length - 1][2]) return words.length - 1; //the whole text can fit
    if (idx <= 0) return 0; //only one word fits
    if (idx > words.length - 1 || words[idx][2] > limitWidth) {
      if (discarded === "down") return idx - 1; //found it
      return findCutIndex(limitWidth, idx - 1, "up");
    } else {
      if (discarded === "up") return idx; //found it
      return findCutIndex(limitWidth, idx + 1, "down");
    }
  }

  return lines;
});

export const getWidth = cached((boundWidth, text, fontSize, font) => {
  if (getLines(boundWidth, text, fontSize, font) > 1) return boundWidth;
  return getMaxWidth(boundWidth, text, fontSize, font);
});

export const getHeight = cached(
  (boundWidth, text, fontSize, lineHeight, font) => {
    const linesCount = getLines(boundWidth, text, fontSize, font);
    return linesCount * lineHeight;
  }
);

const TextTemplate = Template({
  defaultProps,
  output: {
    name: ({ name }) => name(),
    index: ({ index }) => index(),
    classes: ({ classes }) => classes(),
    text: ({ text }) => text(),
    fontFamily: ({ font }) => font()?.names.fontFamily.en ?? "Courier New",
    fontSize: ({ fontSize }) => fontSize(),
    lineHeight: ({ lineHeight }) => lineHeight(),
    width: ({ boundWidth, text, fontSize, font }) =>
      getWidth(boundWidth(), text(), fontSize(), font()),
    height: ({ boundWidth, text, fontSize, lineHeight, font }) =>
      getHeight(boundWidth(), text(), fontSize(), lineHeight(), font()),
    x: ({ boundX }) => boundX(),
    y: ({ boundY }) => boundY(),
  },
});

function Text(...args) {
  const parsedArgs = args[0].text ? args[0] : { text: args[0], ...args[1] };
  return TextTemplate(parsedArgs, args[2]);
}

export default Text;
