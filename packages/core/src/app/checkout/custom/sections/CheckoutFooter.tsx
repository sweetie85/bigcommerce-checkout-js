import React from "react";

const CheckoutFooter = () => {

  return (<footer className="site-footer">
      <div className="footer-container">
        {/* CONTACT */}
        <div className="footer-col">
          <h4>CONTACT</h4>

          <p className="footer-item">

            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.59a1 1 0 01-.25 1.01l-2.2 2.19z"/>
            </svg>

            <a href="tel:18004475797">1 (800) 447 - 5797</a>
          </p>

          <p className="footer-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"/>
            </svg>
 
            <span>
              819 Baker Road <br />
              High Point, NC 27263
            </span>
          </p>

          <p className="footer-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>

            <a href="mailto:customerservice@carolinacookie.com">
              customerservice@carolinacookie.com
            </a>
          </p>
        </div>

        {/* SHOP */}
        <div className="footer-col">
          <h4>SHOP</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Corporate Cookie Gifts</a></li>
            <li><a href="#">Shipping & Returns</a></li>
            <li><a href="#">Contact Us / Request A Catalog</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Sitemap</a></li>
          </ul>
        </div>

        {/* CAROLINA COOKIE */}
        <div className="footer-col">
          <h4>CAROLINA COOKIE</h4>
          <ul>
            <li><a href="#">Shop All</a></li>
            <li><a href="#">Occasions</a></li>
            <li><a href="#">Gift Types</a></li>
            <li><a href="#">Shop By Price</a></li>
          </ul>
        </div>

        {/* NEWSLETTER */}
        <div className="footer-col footer-newsletter">
          <h4>SWEETEN YOUR INBOX</h4>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="enter your email" />
            <button type="submit">SIGN UP</button>
          </form>
        </div>
      </div>
    </footer>
  );
}

export default CheckoutFooter;