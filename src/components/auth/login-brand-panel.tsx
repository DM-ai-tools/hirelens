import type { LoginBrandContext, LoginRoleContent } from "@/lib/login-content";

export function LoginBrandPanel({
  brand,
  content,
}: {
  brand: LoginBrandContext;
  content: Pick<LoginRoleContent, "headline" | "headlineAccent" | "description" | "features">;
}) {
  return (
    <div className="login-page__brand hidden lg:flex">
      <div className="login-page__brand-inner">
        <div className="login-page__logo">
          {brand.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.companyLogo}
              alt={brand.companyName}
              className="login-page__logo-img"
              height={48}
            />
          ) : (
            <span className="login-page__logo-mark" style={{ background: brand.primaryColor }}>
              {brand.productMark}
            </span>
          )}
          <div>
            <div className="login-page__logo-title">
              Hire<span>Lens</span>
            </div>
            <div className="login-page__logo-sub">{brand.portalLabel}</div>
          </div>
        </div>
        <h2 className="login-page__headline">
          {content.headline} <span>{content.headlineAccent}</span>
        </h2>
        <p className="login-page__tagline">{content.description}</p>
        <ul className="login-page__features">
          {content.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="login-page__company-line">
          {brand.companyName} · {brand.contactEmail}
        </p>
      </div>
    </div>
  );
}
