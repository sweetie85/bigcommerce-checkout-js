import React from "react";

const FullPageLoader: React.FC = () => {
  return (
    <div className="full-page-loader__overlay">
      <div className="full-page-loader__spinner"></div>
    </div>
  );
};

export default FullPageLoader;
