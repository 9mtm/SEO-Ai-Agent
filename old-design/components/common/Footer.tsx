import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';


interface FooterProps {
   currentVersion: string
}

const Footer = ({ currentVersion = '' }: FooterProps) => {
   return (
      <footer className='text-center flex flex-1 justify-center pb-5 items-end'>
         <span className='text-gray-500 text-xs'>
            © 2026 Dpro GmbH
         </span>
      </footer>
   );
};

export default Footer;
