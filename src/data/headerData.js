import icon from "../../public/assets/images/header-icon.png";
import logo2 from "../../public/assets/images/logo-2.png";
import logo from "../../public/assets/images/logo.png";

export const navItems = [
  {
    id: 1,
    name: "Home",
    href: "/",
  },
  {
    id: 2,
    name: "About",
    href: "/about",
  },
  {
    id: 3,
    name: "Projects",
    href: "/projects",
  },
  {
    id: 4,
    name: "FAQ",
    href: "/faq",
  },
  {
    id: 6,
    name: "Contact",
    href: "/contact",
  },
];

export const socials = [
  {
    id: 1,
    icon: "fa fa-facebook-square",
    href: "#",
  },
  {
    id: 2,
    icon: "fa fa-twitter",
    href: "#",
  },
  {
    id: 3,
    icon: "fa fa-instagram",
    href: "#",
  },
  {
    id: 4,
    icon: "fa fa-dribbble",
    href: "#",
  },
];

const headerData = {
  logo,
  logo2,
  icon,
  navItems,
  email: "ffundsep490@gmail.com",
  phone: "666 888 0000",
  address: "Lot E2a-7, Road D1, High-Tech Park, Thu Duc City",
  socials,
};

export default headerData;
