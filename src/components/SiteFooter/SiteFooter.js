import footerData from "@/data/siteFooter";
import handleSubmit from "@/utils/handleSubmit";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "../Reuseable/Link";
import Image from "next/image";

const { bg, text, author, year, links, socials, text2, shape, address, contactInfo } =
  footerData;

const SiteFooter = () => {
  const onSubmit = (data) => console.log(data);

  return (
    <footer
      className="relative bg-cover bg-center overflow-hidden text-gray-100"
      style={{ backgroundImage: `url(${bg.src})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gray-900 bg-opacity-90"></div>
      
      <Container className="relative z-10 pt-16 pb-8">
        <Row className="mb-12">
          {/* About Section */}
          <Col lg={3} md={6} sm={6} className="mb-8 md:mb-0">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4 pb-2 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-blue-500">
                About Us
              </h4>
              <p className="text-gray-300 mb-6">{text}</p>
              <ul className="flex space-x-4">
                {socials.map(({ id, icon, href }) => (
                  <li key={id}>
                    <a 
                      href={href} 
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-500 text-white transition-all duration-300 hover:-translate-y-1"
                      aria-label={`Visit our ${icon.replace('fa fa-', '')}`}
                    >
                      <i className={`${icon}`}></i>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
          
          {/* Company Links */}
          <Col lg={3} md={6} sm={6} className="mb-8 md:mb-0">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4 pb-2 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-blue-500">
                Company
              </h4>
              <ul className="space-y-3">
                {links.map(({ id, text, href }) => (
                  <li key={id}>
                    <Link 
                      href={href} 
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center group"
                    >
                      <i className="fa fa-angle-right mr-2 text-gray-500 group-hover:text-blue-400"></i>
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Col>
          
          {/* Address */}
          <Col lg={3} md={6} sm={6} className="mb-8 md:mb-0">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4 pb-2 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-blue-500">
                Address
              </h4>
              <div className="flex">
                <i className="fa fa-map-marker mt-1 mr-3 text-gray-300"></i>
                <p className="text-gray-300">{address}</p>
              </div>
            </div>
          </Col>
          
          {/* Contact & Newsletter */}
          <Col lg={3} md={6} sm={6}>
            <div>
              <h4 className="text-xl font-semibold text-white mb-4 pb-2 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-blue-500">
                Contact Us
              </h4>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <i className="fa fa-envelope mr-3 text-gray-300"></i>
                  <a href={`mailto:${contactInfo.email}`} className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
                    {contactInfo.email}
                  </a>
                </li>
                <li className="flex items-center">
                  <i className="fa fa-phone mr-3 text-gray-300"></i>
                  <a href={`tel:${contactInfo.phone}`} className="text-gray-300 hover:text-blue-400 transition-colors duration-300">
                    {contactInfo.phone}
                  </a>
                </li>
              </ul>
              
              {/* Newsletter */}
              <div className="mt-8">
                <h4 className="text-xl font-semibold text-white mb-4 pb-2 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-blue-500">
                  Newsletter
                </h4>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      className="w-full py-3 pl-4 pr-12 rounded bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button 
                      type="submit"
                      className="absolute right-1.5 top-1.5 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors duration-300"
                      aria-label="Subscribe to newsletter"
                    >
                      <i className="fa fa-envelope"></i>
                    </button>
                  </div>
                </form>
                <p className="text-gray-400 text-sm mt-3">{text2}</p>
              </div>
            </div>
          </Col>
        </Row>
        
        {/* Copyright */}
        <Row>
          <Col lg={12}>
            <div className="text-center py-4 border-t border-gray-700 mt-6">
              <p className="text-gray-400 text-sm">
                © Copyright {year} by {author}. All Rights Reserved.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
      
      <div className="absolute bottom-0 right-0 opacity-10">
        <Image src={shape.src} alt="" />
      </div>
    </footer>
  );
};

export default SiteFooter;