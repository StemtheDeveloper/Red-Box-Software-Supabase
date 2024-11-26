import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Logo from '../assets/images/RBS Logo main.svg';

function Navbar({ session }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav>
      <Link to="/" onClick={closeMenu}>
        <img id="logo" src={Logo} alt="RBS Logo" />
      </Link>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/about" onClick={closeMenu}>About</Link>
        <Link to="/products" onClick={closeMenu}>Products</Link>
        <Link to="/projects" onClick={closeMenu}>Projects</Link>
        <Link to="/gallery" onClick={closeMenu}>Gallery</Link>
        <Link to="/contact" onClick={closeMenu}>Contact</Link>
        <Link to="/shape_edit" onClick={closeMenu}>Shape</Link>
        {session && session.user.email === 'stiaan44@gmail.com' && (
          <Link to="/admin" onClick={closeMenu}>Admin</Link>
        )}
        {session ? (
          <button onClick={() => { handleSignOut(); closeMenu(); }}>Sign Out</button>
        ) : (
          <Link to="/auth" onClick={closeMenu}>Sign In</Link>
        )}
      </div>
      <button className="burger-menu" onClick={toggleMenu}>
        ☰
      </button>
    </nav >
  );
}

export default Navbar;
