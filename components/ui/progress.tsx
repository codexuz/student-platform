"use client";

import { Progress as ChakraProgress } from "@chakra-ui/react";
import * as React from "react";

export interface ProgressBarProps extends ChakraProgress.RootProps {
  striped?: boolean;
  animated?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(props, ref) {
    const { striped, animated, children, ...rest } = props;

    return (
      <ChakraProgress.Root ref={ref} {...rest}>
        <ChakraProgress.Track>
          <ChakraProgress.Range
            css={
              striped
                ? {
                    backgroundImage:
                      "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
                    backgroundSize: "1rem 1rem",
                    ...(animated && {
                      animation: "progress-stripes 1s linear infinite",
                    }),
                  }
                : {}
            }
          />
        </ChakraProgress.Track>
        {children}
      </ChakraProgress.Root>
    );
  },
);

export const Progress = {
  Root: ChakraProgress.Root,
  Track: ChakraProgress.Track,
  Range: ChakraProgress.Range,
  Label: ChakraProgress.Label,
  ValueText: ChakraProgress.ValueText,
};
