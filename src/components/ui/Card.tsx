import { View, type ViewProps } from "react-native";
import type { ReactNode } from "react";

interface Props extends ViewProps {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, className, ...rest }: Props & { className?: string }) {
  return (
    <View
      className={`bg-surface border border-border rounded-2xl ${padded ? "p-4" : ""} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </View>
  );
}
