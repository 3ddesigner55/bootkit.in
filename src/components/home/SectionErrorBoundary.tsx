"use client";

import React, { Component, type ReactNode } from "react";

interface SectionErrorBoundaryProps {
  sectionId?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SectionErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[SectionErrorBoundary] Render failure in section "${this.props.sectionId || "unknown"}":`,
      error.message,
      errorInfo.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
