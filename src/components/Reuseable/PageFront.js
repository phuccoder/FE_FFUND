import bg from "../../../public/assets/images/page-title-bg.jpg";
import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import Link from "./Link";

const PageFront = () => {
    return (
        <div className="w-full py-14">
            {/* Bạn có thể thêm tiêu đề nhẹ hoặc để trống, ở đây chỉ tạo khoảng cách */}
            <div className="text-center text-2xl font-semibold text-gray-700">
                {/* Có thể để trống nếu không cần chữ */}
            </div>
        </div>
    );
};

export default PageFront;