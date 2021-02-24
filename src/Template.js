import { parseProps } from "./utils";

export default function Template({ defaultProps, output, childProps }) {
  return (ownProps) => ({
    ownProps: parseProps(ownProps),
    defaultProps: parseProps(defaultProps),
    output,
    childProps,
  });
}
