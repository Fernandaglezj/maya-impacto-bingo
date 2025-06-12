import React from 'react';
import { useDrag } from 'react-dnd';
import { motion } from 'framer-motion';

interface FloatingAvatarProps {
  emoji: string;
  index: number;
  imageUrl?: string | null;
  readOnly?: boolean;
}

const FloatingAvatar: React.FC<FloatingAvatarProps> = ({
  emoji,
  index,
  imageUrl = null,
  readOnly = false
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'avatar',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !readOnly
  }));

  return (
    <motion.div
      ref={drag}
      className={`
        relative w-12 h-12 rounded-full overflow-hidden
        ${!readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
      style={{
        willChange: 'transform',
        contain: 'layout style paint'
      }}
      whileHover={!readOnly ? { scale: 1.1 } : {}}
      whileTap={!readOnly ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Avatar ${emoji}`}
          className="w-full h-full object-cover rounded-full"
          draggable={false}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-amber-100 flex items-center justify-center text-2xl">
          {emoji}
    </div>
      )}
    </motion.div>
  );
};

export default React.memo(FloatingAvatar);
