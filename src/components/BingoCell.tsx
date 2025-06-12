import React from 'react';
import { useDrop } from 'react-dnd';
import FloatingAvatar from './FloatingAvatar';

interface BingoCellProps {
  text: string;
  index: number;
  assignedAvatars: number[];
  avatarEmojis: string[];
  onDrop: (cellIndex: number, avatarIndex: number) => void;
  onRemoveAvatar: (cellIndex: number, avatarIndex: number) => void;
  isTeamCell?: boolean;
  maxAvatars?: number;
  readOnly?: boolean;
}

const BingoCell: React.FC<BingoCellProps> = ({
  text,
  index,
  assignedAvatars,
  avatarEmojis,
  onDrop,
  onRemoveAvatar,
  isTeamCell = false,
  maxAvatars = 3,
  readOnly = false
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'avatar',
    drop: (item: { index: number }) => {
      onDrop(index, item.index);
    },
    canDrop: () => !readOnly && (assignedAvatars?.length || 0) < maxAvatars,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // Determinar el estilo del borde basado en el estado
  const getBorderStyle = () => {
    if (readOnly) return 'border-amber-200/30';
    if (isOver && canDrop) return 'border-green-400 border-2';
    if (canDrop) return 'border-amber-200/50 hover:border-amber-200';
    return 'border-amber-200/30';
  };

  // Determinar el estilo del fondo basado en el estado
  const getBackgroundStyle = () => {
    if (readOnly) return 'bg-amber-900/40';
    if (isOver && canDrop) return 'bg-green-900/20';
    if (isTeamCell) return 'bg-amber-800/40';
    return 'bg-amber-900/40';
  };

  return (
    <div
      ref={drop}
      className={`
        relative p-4 rounded-xl backdrop-blur-sm
        border transition-colors duration-200
        ${getBorderStyle()}
        ${getBackgroundStyle()}
        ${readOnly ? 'cursor-default' : 'cursor-pointer'}
        transform-gpu
      `}
      style={{
        willChange: 'transform',
        contain: 'layout style paint'
      }}
    >
      {/* Indicador de casilla obligatoria */}
      {isTeamCell && !readOnly && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
          Obligatoria
        </div>
      )}
      
      {/* Texto de la casilla */}
      <p className="text-amber-100 mb-4 min-h-[3rem] text-sm">
        {text}
      </p>
      
      {/* Contenedor de avatares con altura fija */}
      <div 
        className="min-h-[80px] flex flex-wrap gap-2 items-center justify-center"
        style={{
          willChange: 'contents',
          contain: 'layout style'
        }}
      >
        {assignedAvatars?.map((avatarIndex) => (
          <div
            key={avatarIndex}
            className="relative"
            style={{
              willChange: 'transform',
              contain: 'layout style paint'
            }}
          >
            <FloatingAvatar
              emoji={avatarEmojis[avatarIndex]}
              index={avatarIndex}
              readOnly={readOnly}
            />
            {!readOnly && (
            <button
              onClick={() => onRemoveAvatar(index, avatarIndex)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                style={{
                  willChange: 'transform',
                  transform: 'translate3d(0,0,0)'
                }}
              >
                ×
            </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Indicador de espacio disponible */}
      {!readOnly && (assignedAvatars?.length || 0) < maxAvatars && (
        <div className="absolute bottom-2 right-2 text-xs text-amber-200/60">
          {maxAvatars - (assignedAvatars?.length || 0)} espacios
        </div>
      )}
    </div>
  );
};

export default React.memo(BingoCell);
