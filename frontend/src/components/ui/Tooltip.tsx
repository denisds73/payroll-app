/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { type ReactNode, useState } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'cursor';
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  disabled = false,
}: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    cursor: '',
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setShowTooltip(true);
    setTimeout(() => setIsVisible(true), 10);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setTimeout(() => setShowTooltip(false), 200);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (position === 'cursor') {
      setCursorPos({ x: e.clientX, y: e.clientY });
    }
  };

  const tooltipStyle =
    position === 'cursor'
      ? {
          position: 'fixed' as const,
          left: `${cursorPos.x + 16}px`,
          top: `${cursorPos.y + 16}px`,
          zIndex: 9999,
        }
      : {};

  const transitionStyle = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
    transition: 'opacity 200ms ease-out, transform 200ms ease-out',
  };

  return (
    <>
      {showTooltip && (
        <div
          style={{
            ...tooltipStyle,
            ...transitionStyle,
            pointerEvents: 'none',
          }}
          className={`absolute ${positionClasses[position]} z-50`}
        >
          <div className="bg-card border border-gray-200 rounded-lg py-2.5 px-3.5 shadow-md max-w-xs">
            {typeof content === 'string' ? (
              <div className="text-xs text-text-secondary leading-relaxed">{content}</div>
            ) : (
              content
            )}
          </div>
        </div>
      )}

      <div
        className={position === 'cursor' ? '' : 'relative inline-block'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
    </>
  );
}
