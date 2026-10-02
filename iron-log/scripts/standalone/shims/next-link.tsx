import * as React from "react";

/**
 * `next/link` for the standalone build.
 *
 * The site ships as one file opened over file://, where there is no server to
 * resolve `/workout` against — so every route lives behind the hash and this
 * shim is the one place that knows it. Call sites keep writing `href="/workout"`
 * exactly as they do under Next; nothing in `src/` is aware the router changed.
 *
 * Next-only props are swallowed rather than forwarded: React would warn about
 * `prefetch` on a DOM <a>, and none of them mean anything here.
 */
type LinkProps = Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

export default function Link({
  href,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  children,
  ...rest
}: LinkProps) {
  return (
    <a href={`#${href}`} {...rest}>
      {children}
    </a>
  );
}
