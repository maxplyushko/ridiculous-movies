import {Radiation} from "lucide-react";

export const PageLoader = () => {
  return (
      <div className="page-loader">
        <Radiation className="page-loader__icon" size={48} strokeWidth={1.75} aria-hidden="true"/>
        <label className="page-loader__label" htmlFor="page-loader">PLEASE STAND BY</label>
      </div>
  );
}