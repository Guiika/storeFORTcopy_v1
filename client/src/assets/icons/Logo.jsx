import React from 'react';

import { ReactComponent as LogoSvg } from '../vector/FORT.svg';

const Logo = () => {
  return (
    <LogoSvg
      className="logoSvg"
      style={{ height: 20 }}
      fill="currentColor"
      stroke="none"
    />
  );
};

export default Logo;