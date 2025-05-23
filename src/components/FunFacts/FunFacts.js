import { funFacts } from "@/data/funFacts";
import React from "react";
import { Container, Row } from "react-bootstrap";
import FunFactsItem from "./FunFactsItem";
import Image from "next/image";

const { facts, shape1, shape2 } = funFacts;

const FunFacts = ({ className = "" }) => {
  return (
    <section style={{ marginBottom: "130px" }} className={`fun-facts-area ${className}`}>
      <Container>
        <Row>
          {facts.map((fact) => (
            <FunFactsItem key={fact.id} fact={fact} />
          ))}
        </Row>
      </Container>
      <div className="fun-facts-shape-1">
        <Image src={shape1.src} alt="" />
      </div>
      <div className="fun-facts-shape-2">
        <Image src={shape2.src} alt="" />
      </div>
    </section>
  );
};

export default FunFacts;
