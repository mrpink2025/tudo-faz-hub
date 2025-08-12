import React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  title?: string;
};

const Logo: React.FC<LogoProps> = ({ className, title = "tudofaz" }) => {
  return (
    <img
      src="/lovable-uploads/35efc0ad-a245-43eb-8397-fc5392b06da7.png"
      alt={title}
      className={cn("block h-10 w-auto", className)}
      loading="eager"
      width={192}
      height={192}
    />
  );
};

export default Logo;
