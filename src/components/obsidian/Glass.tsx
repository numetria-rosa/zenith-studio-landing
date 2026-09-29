import type { ComponentPropsWithoutRef, ElementType } from "react";

/** The base surface: 3.5% white fill, hairline border, inset top highlight (`.glass` in obsidian.css). */
export function Glass<T extends ElementType = "div">({
  as,
  className = "",
  ...rest
}: { as?: T; className?: string } & Omit<ComponentPropsWithoutRef<T>, "as" | "className">) {
  const Tag: ElementType = as ?? "div";
  return <Tag className={`glass ${className}`} {...rest} />;
}
