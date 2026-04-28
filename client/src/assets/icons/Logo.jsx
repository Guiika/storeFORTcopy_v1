import React from 'react';

import { ReactComponent as LogoSvg } from './FORT.svg';

const Logo = () => {
  return <LogoSvg className="logoSvg" style={{ height: 20 }} stroke="currentColor"/>;
};

export default Logo;