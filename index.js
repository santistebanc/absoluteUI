import { cached, Context, store } from "./src/direct";
import Box from "./src/templates/Box";
import Text from "./src/templates/Text";
import View from "./src/View";
import RenderToDOM from "./src/RenderToDOM";
import opentype from "opentype.js";

const { screenWidth, screenHeight, appFont, title, page } = store({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  appFont: null,
  title: "hello world",
  page: 0,
});

const base = document.querySelector("#app");
RenderToDOM(base, View(Text(cached(() => "hello " + page()))));

// opentype.load("fonts/OpenSans-Regular.ttf").then((font) => appFont(font));

// const waka = Text("whakakaka this is my text that i want to share");

// const header = Text(title);

// const long = Text(
//   "this one is a bit longer, but not really that long, like its not an essay or anything like that, its just a very long single sentence text for testing purposes."
// );

// const pag = Text(() => String(page()));

// const content = Box(
//   () =>
//     !appFont()
//       ? Text("loading...")
//       : [
//           Text("left section"),
//           Box(() => (page() % 2 === 1 ? [long, waka] : [waka, pag, long, header]), {
//             gapHorizontal: 10,
//             gapVertical: 10,
//           }),
//         ],
//   {
//     width: screenWidth,
//     paddingTop: 10,
//     paddingBottom: 10,
//     paddingLeft: 10,
//     paddingRight: 10,
//   }
// );

// window.onresize = () => {
//   store({
//     screenWidth: window.innerWidth,
//     screenHeight: window.innerHeight,
//   });
// };

// setTimeout(() => title("another title"), 2000);

// setInterval(() => page(page() + 1), 5000);

// // setInterval(() => count(10), 100);

// const base = document.querySelector("#app");

// const withTheme = Context({ lineHeight: 20, font: appFont });
// RenderToDOM(base, View(withTheme(content)));
