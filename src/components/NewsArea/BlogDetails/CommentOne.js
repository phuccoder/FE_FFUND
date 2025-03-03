import Image from "next/image";
import React from "react";


const CommentOneSingle = ({ comment = {} }) => {
  const { image, name, date, text, title } = comment;

  return (
    <div className="comment-one__single">
      <div className="comment-one__image">
      <Image 
        src={`/assets/images/${image}`} 
        alt={title}  
        unoptimized
        style={{ width: '100%', height: 'auto' }}
      />
      </div>
      <div className="comment-one__content">
        <h3>
          {name} <span className="comment-one__date"> {date}</span>
        </h3>
        <p>{text}</p>
      </div>
      <div className="blog-btn">
        <a href="#" className="main-btn">
          Reply
        </a>
      </div>
    </div>
  );
};

const CommentOne = ({ comments = [], className = "" }) => {
  return (
    <div className={`comment-one ${className}`}>
      <h3 className="comment-one__block-title">{comments.length} Comments</h3>
      {comments.map((comment) => (
        <CommentOneSingle comment={comment} key={comment.id} />
      ))}
    </div>
  );
};

export default CommentOne;
