import React from 'react';
import { ReactComponent as HeartSvg } from '../vector/like.svg';

const HeartIcon = ({ filled = false }) => (
  filled
    ? <HeartSvg fill="currentColor" stroke="none" />
    : <HeartSvg fill="none" stroke="currentColor" strokeWidth="1.5" />
);

export default HeartIcon;
