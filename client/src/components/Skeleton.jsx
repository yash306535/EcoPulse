import PropTypes from "prop-types";

/**
 * Shimmering placeholder shown while async content loads.
 * @param {{ className?: string }} props
 */
export default function Skeleton({ className = "" }) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}

Skeleton.propTypes = {
  className: PropTypes.string,
};
