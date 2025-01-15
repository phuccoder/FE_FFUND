import { blogAuthor } from "@/data/newsArea";
import Image from "next/image";
import React from "react";


const { image, name, text } = blogAuthor;

const BlogAuthor = () => {
  return (
    <div className="blog-author">
      <div className="blog-author__image">
        <Image src={image.src} alt="author" />
      </div>
      <div className="blog-author__content">
        <h3>{name}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default BlogAuthor;
