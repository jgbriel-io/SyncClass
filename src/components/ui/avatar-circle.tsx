import { cn } from "@/lib/utils";
import { AVATAR_SIZES, type AvatarSize } from "@/lib/design-tokens/avatar-sizes";

interface AvatarCircleProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

export function AvatarCircle({ 
  name, 
  size = 'DEFAULT',
  className 
}: AvatarCircleProps) {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div 
      className={cn(
        "rounded-full bg-accent flex items-center justify-center flex-shrink-0",
        AVATAR_SIZES[size],
        className
      )}
    >
      <span className="font-medium text-accent-foreground">
        {initial}
      </span>
    </div>
  );
}
