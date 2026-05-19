import React from 'react';
import { ReactComponent as CartSvg } from '../vector/cart.svg';
import { ReactComponent as CartNullSvg } from '../vector/cart_null.svg';

const CartIcon = ({ filled = false }) => (
  filled
    ? <CartSvg fill="currentColor" stroke="none" />
    : <CartNullSvg fill="none" stroke="currentColor" strokeWidth="1.5" />
);

export default CartIcon;
