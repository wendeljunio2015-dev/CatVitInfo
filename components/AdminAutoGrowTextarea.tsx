"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number;
};

export default function AdminAutoGrowTextarea({ minRows = 5, className = "", ...props }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize]);

  return (
    <textarea
      {...props}
      ref={ref}
      rows={minRows}
      onInput={(event) => {
        resize();
        props.onInput?.(event);
      }}
      onPaste={() => requestAnimationFrame(resize)}
      className={`overflow-hidden resize-y leading-relaxed ${className}`}
    />
  );
}
