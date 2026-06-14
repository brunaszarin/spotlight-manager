/// <reference types="vite/client" />
/// <reference types="@react-router/node" />

declare namespace JSX {
  interface IntrinsicElements {
    "s-app-nav": React.DetailedHTMLProps
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    "s-link": React.DetailedHTMLProps
      React.AnchorHTMLAttributes<HTMLElement> & { href?: string },
      HTMLElement
    >;
  }
}
