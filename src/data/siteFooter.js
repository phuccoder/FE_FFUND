import bg from "../../public/assets/images/footer-bg.jpg";
import shape from "../../public/assets/images/footer-shape.png";
import logo from "../../public/assets/images/logo-2.png";

export const socials2 = [
  {
    id: 1,
    icon: "fa fa-twitter",
    href: "#",
  },
  {
    id: 2,
    icon: "fa fa-facebook-official",
    href: "#",
  },
  {
    id: 3,
    icon: "fa fa-pinterest",
    href: "#",
  },
  {
    id: 4,
    icon: "fa fa-instagram",
    href: "#",
  },
];

const footerData = {
  logo,
  bg,
  socials: socials2,
  text: "We are a team of passionate individuals dedicated to helping startups and investors connect.",
  text2:
    "Sign up for our latest news & articles. We won’t give you spam mails.",
  shape,
  links: [
    {
      id: 1,
      text: "About us",
      href: "/about",
    },
    {
      id: 2,
      text: "Knowledge hub",
      href: "/faq",
    },
    {
      id: 3,
      text: "Contact",
      href: "/contact",
    },
  ],
  address: "Lot E2a-7, Road D1, High-Tech Park, Thu Duc City",
  contactInfo: {
    email: "ffundsep490@gmail.com",
    phone: "+84 123 456 789"
  },
  author: "FFund",
  year: new Date().getFullYear(),
};

export default footerData;
