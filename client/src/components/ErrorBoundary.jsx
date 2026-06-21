import { Component } from "react";
import PropTypes from "prop-types";

/**
 * Catches rendering errors anywhere in the component tree and shows a friendly
 * fallback instead of a blank screen — important for a live judged demo.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[EcoPulse] render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-2xl font-bold text-charcoal">Something went wrong 🌱</h1>
          <p className="text-slate mt-2 max-w-md">
            The app hit an unexpected error. Refreshing the page usually fixes it.
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload EcoPulse
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
