import { cn } from "@/lib/utils";
import { AVATAR_SIZES, type AvatarSize } from "@/lib/design-tokens/avatar-sizes";

interface AvatarCircleProps {
  name: string;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function AvatarCircle({ 
  name, 
  avatarUrl,
  size = 'DEFAULT',
  className 
}: AvatarCircleProps) {
  const initial = name.charAt(0).toUpperCase();
  
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          AVATAR_SIZES[size],
          className
        )}
      />
    );
  }
  
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
