import BrandLogo from './BrandLogo';

type GlobalLoadingOverlayProps = {
  visible: boolean;
  exiting: boolean;
};

export default function GlobalLoadingOverlay({ visible, exiting }: GlobalLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className={`global-loader-overlay ${exiting ? 'exit' : 'enter'}`}>
      <div className="global-loader-card">
        <div className="global-loader-brand">
          <BrandLogo className="w-14 h-14 sm:w-16 sm:h-16" roundedClassName="rounded-2xl bg-white p-1.5 shadow-md" />
          <h1 className="global-loader-title">CIN - Stage &amp; Formation</h1>
        </div>
        <div className="global-loader-progress-track" aria-hidden="true">
          <div className="global-loader-progress-bar" />
        </div>
      </div>
    </div>
  );
}
