import React from "react";
import ReactDOM from "react-dom";
import LoadingWheel from "./LoadingWheel";

// Create basic render test
it("renders without crashing", () => {
  // Create div element
  const div = document.createElement("div");
  // Render about on the div
  ReactDOM.render(<LoadingWheel />, div);
  // Clean unmount
  ReactDOM.unmountComponentAtNode(div);
});