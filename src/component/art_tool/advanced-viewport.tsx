import React from "react";
import Viewport from "./viewport";

const AdvancedViewport: React.FC = () => {
  return (
    <div style={{ height: "calc(100vh - 80px)" }}>
      <Viewport />
    </div>
  );
};

export default AdvancedViewport;
