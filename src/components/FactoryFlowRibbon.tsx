type FlowStage = {
  label: string;
  activeOrders: number;
  blockedOrders: number;
};

type FactoryFlowRibbonProps = {
  stages: FlowStage[];
};

export default function FactoryFlowRibbon({ stages }: FactoryFlowRibbonProps) {
  return (
    <div className="flow-ribbon" aria-label="Factory flow ribbon">
      {stages.map((stage, index) => {
        const hasBlock = stage.blockedOrders > 0;
        const isActive = stage.activeOrders > 0;

        return (
          <div
            key={stage.label}
            className={`flow-stage ${hasBlock ? 'blocked' : ''} ${isActive ? 'live' : ''}`}
          >
            <span className="flow-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{stage.label}</strong>
            <small>
              {stage.activeOrders} active - {stage.blockedOrders} blocked
            </small>
          </div>
        );
      })}
    </div>
  );
}
