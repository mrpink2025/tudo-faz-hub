import React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  return (
    <img
      src="/lovable-uploads/tudofaz-logo-new.png"
      alt={title}
      className={cn("block h-10 w-auto object-contain", className)}
      loading="eager"
      width={512}
      height={128}
    />
  );
};

export default Logo;
