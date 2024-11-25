import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/images/RBS Logo main.svg'

function Footer() {
  return (
    <footer>
      <div className="footer-content">
        {/* <img id="footer-logo" src={Logo} alt="RBS Logo" /> */}
        <div className="footer-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms-of-service">Terms of Service</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/manage-cookies">Manage Cookies</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Red Box Software LTD</p>
      </div>
    </footer>
  )
}

export default Footer