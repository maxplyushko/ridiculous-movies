import {Radiation} from "lucide-react";

const StatPage = () => {
  return (
    <section className="stat-page">
      <div className="stat-page__standby">
        <Radiation className="stat-page__icon" size={48} strokeWidth={1.75} aria-hidden="true"/>
        <p className="stat-page__label">PLEASE STAND BY</p>
      </div>
    </section>
  );
};

export default StatPage;
