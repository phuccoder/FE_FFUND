import { clientArea } from "@/data/clientArea";
import Image from "next/image";
import React from "react";
import { Container } from "react-bootstrap";
import SwiperCore, { Autoplay } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

SwiperCore.use([Autoplay]);

const options = {
  slidesPerView: 3,
  spaceBetween: 30,
  loop: true,
  autoplay: {
    delay: 3000,
  },
  breakpoints: {
    1600: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    1200: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    0: {
      slidesPerView: 1,
      spaceBetween: 0,
    },
  },
};

const { title, clients } = clientArea;

const ClientItem = ({ client = {} }) => {
  const { text, name, image } = client;

  return (
    <div className="client-item text-center">
      <i className="flaticon-left-quotes-sign"></i>
      <p>{text}</p>
      <h5 className="title">- {name}</h5>
      <Image
        src={`/assets/images/${image}`}
        alt={name}
        unoptimized
      />
    </div>
  );
};

const ClientArea = () => {
  return (
    <section className="client-area">
      <div className="client-top text-center">
        <h3 className="title">{title}</h3>
      </div>
      <Container fluid>
        <div className="client-active">
          <Swiper {...options}>
            <div className="swiper-wrapper">
              {clients.map((client) => (
                <SwiperSlide key={client.id}>
                  <ClientItem client={client} />
                </SwiperSlide>
              ))}
            </div>
          </Swiper>
        </div>
      </Container>
    </section>
  );
};

export default ClientArea;