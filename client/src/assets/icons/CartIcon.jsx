import React from 'react';

import { ReactComponent as EmptyCartSvg } from '../vector/cart_null.svg';
import { ReactComponent as FilledCartSvg } from '../vector/cart.svg';

const CartIcon = ({ filled = false }) => {
  const Icon = filled ? FilledCartSvg : EmptyCartSvg;

  return (
    <Icon
      fill="currentColor"
      stroke="none"
    />
  );
};

export default CartIcon;