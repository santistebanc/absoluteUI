import { parseProps } from "./utils.js";

export default function Template({ defaultProps, output, childProps }) {
  return (ownProps) => ({
    ownProps: parseProps(ownProps),
    defaultProps: parseProps(defaultProps),
    output,
    childProps,
  });
}
