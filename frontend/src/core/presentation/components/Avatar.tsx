import type { MessageRole } from '../../../features/chat/domain/entities/Message';
import { KraidIcon } from './icons';

interface AvatarProps {
  role: MessageRole;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar = ({ role, size = 'sm' }: AvatarProps) => {
  const dim = size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8 text-sm' : 'h-12 w-12 text-xl';
  const iconDim = size === 'sm' ? 'h-3.5 w-3.5' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6';

  if (role === 'assistant') {
    return (
      <div className={`${dim} flex flex-shrink-0 items-center justify-center rounded-full bg-accent font-medium text-ivory shadow-sm`}>
        <KraidIcon className={iconDim} />
      </div>
    );
  }

  return (
    <div className={`${dim} flex flex-shrink-0 items-center justify-center rounded-full bg-warm-sand font-medium text-charcoal-warm`}>
      U
    </div>
  );
};
