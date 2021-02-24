import { auto, Context, store } from "./src/direct.js";
import Box from "./src/templates/Box.js";
import Text from "./src/templates/Text.js";
import View from "./src/View.js";
import RenderToDOM from "./src/RenderToDOM.js";
// import opentype from "./_snowpack/pkg/opentypejs.js";

const { screenWidth, screenHeight, appFont, title, page, g } = store({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  appFont: null,
  title: "hello world",
  page: 0,
  g: 20,
});

// opentype.load("fonts/OpenSans-Regular.ttf").then((font) => appFont(font));

const waka = Text("whakakaka this is my text that i want to share", {
  name: "waka",
});

const header = Text(() => "this is page " + page(), { name: "header" });

const long = Text(
  "this one is a bit longer, but not really that long, like its not an essay or anything like that, its just a very long single sentence text for testing purposes.",
  { name: "long" }
);

const pag = Text(() => String(page()), { name: "pag" });

const content = Box(
  () => [
    Text("left section", { name: "leftSec" }),
    Box(() => (page() % 2 === 1 ? [long, waka] : [waka, pag, long, header]), {
      gapHorizontal: 10,
      gapVertical: 10,
      name: "wrappingBox",
    }),
  ],
  {
    width: screenWidth,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    name: "mainBox",
  }
);

// const content = Box(
//   [
//     Text("yo"),
//     Box(() => (page() % 2 === 0 ? [long, waka] : [long])),
//   ],
//   {
//     width: screenWidth,
//     paddingTop: 10,
//     paddingBottom: 10,
//     paddingLeft: 10,
//     paddingRight: 10,
//     name: "innerBox",
//   }
// );

window.onresize = () => {
  store({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  });
};

setTimeout(() => title("another title"), 2000);

setInterval(() => page(page() + 1), 2000);

// setTimeout(() => g(30), 5000);

// setInterval(() => count(10), 100);

const base = document.querySelector("#app");

const withTheme = Context({ });
RenderToDOM(base, View(withTheme(content)));
