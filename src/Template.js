export default function Template({ defaultProps, output, childProps }) {
  return (ownProps) => ({
    ownProps,
    defaultProps,
    output,
    childProps,
  });
}
