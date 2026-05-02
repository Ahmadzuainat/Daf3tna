import React from 'react';

export const PostSkeleton = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '4px', 
    padding: '0 4px' 
  }}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
      <div key={i} style={{ 
        aspectRatio: '1/1', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '4px', 
        animation: 'pulse 2s infinite' 
      }} />
    ))}
  </div>
);
