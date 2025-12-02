import StrategyBuilder from "@/components/strategy/StrategyBuilder";
import { useLocation } from "react-router-dom";

const StrategyBuilderPage = () => {
  const location = useLocation();
  const initialStrategy = location.state?.strategy || null;

  return <StrategyBuilder initial={initialStrategy} />;
};

export default StrategyBuilderPage;