/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

declare namespace JSX {
  interface IntrinsicElements {
    "s-app-nav": {
      children?: import("react").ReactNode;
      [key: string]: unknown;
    };
    "s-link": {
      href?: string;
      children?: import("react").ReactNode;
      [key: string]: unknown;
    };
  }
}
