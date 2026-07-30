import React from "react";

const CheckoutFooter = () => {

  return (<footer className="site-footer">
    <section className="footer-info" style={{ textAlign: 'center'}}>

      <article className="footer-info-col footer-info-col--small accordion-item mobile-hidden" data-section-type="storeInfo">

        <img src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/footer-logo.png?t=1774418815" style={{width:'106px', marginBottom:'20px'}}></img>
        <div className="footer-col footer-newsletter">
          <h3 style={{ display: 'flex', marginBottom: '12px' }} className="footer-info-heading" data-uw-rm-heading="prs">SWEETEN YOUR INBOX</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="enter your email" />
            <div>
              <button type="submit">SIGN UP</button>
            </div>
          </form>
        </div>

        <div style={{display:'flex', columnGap:'5px', marginTop: '12px'}}>
            <p>
              <a href="https://www.facebook.com/CarolinaCookieCompany/" target="_blank" style={{padding:0}}>
                <img 
                  src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/facebook.png?t=1759727008" 
                  style={{width:'28px'}}>
                </img>
              </a>
            </p>
            <p>
              <a href="https://www.instagram.com/carolina_cookie_company/?hl=en" target="_blank" style={{padding:0}} >
                <img 
                  src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/instagram.png?t=1759727006" 
                  style={{width:'28px'}}>
                </img>
              </a>
            </p> 
        </div>
      </article>

      <article className="footer-info-col footer-info-col--small accordion-item" data-section-type="storeInfo">
                    <h3 style={{ display: 'flex' }} className="footer-info-heading" data-uw-rm-heading="prs">CONTACT</h3>
                    
                    <div style={{ display: 'flex', columnGap: '10px', color: 'white', fontSize: '12px', marginBottom:'15px'}}>
                        <img src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/layer-1.png?t=1746646926" style={{width:'17px', height: '17px'}} role="presentation" data-uw-rm-alt-original="null" alt="" data-uw-rm-alt-hash="3338908027751811" data-uw-rm-alt="SM" />
                        <p style={{margin:0}} data-alpine-devtools-right-click="">1 (800) 447 - 5797</p>
                    </div>
                    
                    <div style={{ display: 'flex', columnGap: '10px', color: 'white', fontSize: '12px', marginBottom:'15px', alignItems: 'center'}}>
                        <img src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/layer-1-3-.png?t=1746646912" style={{width:'17px', height: '17px'}} role="presentation" data-uw-rm-alt-original="null" alt="" data-uw-rm-alt-hash="3338908027751811" data-uw-rm-alt="SM" />
                        <p style={{margin:0}}>819 Baker Road<br/>
High Point, NC 27263</p>
                    </div>
                    
                    <div style={{ display: 'flex', columnGap: '10px', color: 'white', fontSize: '12px', marginBottom:'15px',  alignItems: 'center'}}>
                        <img src="https://cdn11.bigcommerce.com/s-fr5gzufqwh/images/stencil/original/image-manager/layer-1-2-.png?t=1746646920" style={{width:'17px', height: '17px'}} role="presentation" data-uw-rm-alt-original="null" alt="" data-uw-rm-alt-hash="3338908027751811" data-uw-rm-alt="SM" />
                        <p style={{margin:0}}>customerservice@carolinacookie.com</p>
                    </div>
                    
                </article>
        <article className="footer-info-col footer-info-col--small accordion-item" data-section-type="footer-webPages">
            <h3 className="footer-info-heading accordion-header" data-uw-rm-heading="prs">SHOP</h3>
            <ul className="footer-info-list accordion-content">
                    <li>
                        <a href="https://carolinacookie.com/contact-us-tj3z/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/contact-us-tj3z/">Contact Us</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/faq/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/faq/">FAQ</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/about-us/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/about-us/">About Us</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/corporate-cookie-gifts/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/corporate-cookie-gifts/">Corporate Cookie Gifts</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/shipping-returns/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/shipping-returns/">Shipping &amp; Returns</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/freshness-guarantee/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/freshness-guarantee/">Freshness Guarantee </a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/contact-us/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/contact-us/">Contact Us / Request a Catalog</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/blog/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/blog/">Blog</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/privacy-policy/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/privacy-policy/">Privacy Policy</a>
                    </li>
                <li>
                    <a href="https://carolinacookie.com/sitemap.php" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/sitemap.php">Sitemap</a>
                </li>
            </ul>
        </article>

        <article className="footer-info-col footer-info-col--small accordion-item" data-section-type="footer-categories">
            <h3 className="footer-info-heading accordion-header" data-uw-rm-heading="prs">CAROLINA COOKIE</h3>
            <ul className="footer-info-list accordion-content">
                    <li>
                        <a href="https://carolinacookie.com/corporate-gift/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/corporate-gift/">Corporate Gift</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/shop-gifts/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/shop-gifts/">Shop Gifts</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/occasions/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/occasions/">Occasions</a>
                    </li>
                    <li>
                        <a href="https://carolinacookie.com/recipients/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/recipients/">Recipients</a>
                    </li>
                <li><a href="https://carolinacookie.com/content/2025-holidaycatalog.pdf" target="_blank" aria-label="Holiday Catalog - open in a new tab" data-uw-rm-ext-link="" uw-rm-external-link-id="https://carolinacookie.com/content/2025-holidaycatalog.pdf$holidaycatalog" data-uw-pdf-br="1" data-uw-pdf-doc="">Holiday Catalog</a></li>
                <li><a href="https://carolinacookie.com/flavors-and-nutrition/" data-uw-rm-brl="PR" data-uw-original-href="https://carolinacookie.com/flavors-and-nutrition/">Flavors &amp; Nutrition</a></li>
            </ul>
        </article>
    </section>
</footer>
  );
}

export default CheckoutFooter;