import styles from "./BottomNav.module.css";

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function CellarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l-2 7a6 6 0 0012 0l-2-7H8z" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const tabs = [
  { id: "scan",     label: "Scan",     Icon: ScanIcon,    isScan: true },
  { id: "cellar",   label: "Cellar",   Icon: CellarIcon },
  { id: "discover", label: "Discover", Icon: DiscoverIcon },
  { id: "social",   label: "Social",   Icon: SocialIcon },
  { id: "profile",  label: "Profile",  Icon: ProfileIcon },
];

export function BottomNav({ tab, onTabChange }) {
  return (
    <nav className={styles.nav}>
      {tabs.map(({ id, label, Icon, isScan }) => (
        <button
          key={id}
          className={`${styles.tab} ${isScan ? styles.scanTab : ""} ${tab === id ? styles.active : ""}`}
          onClick={() => onTabChange(id)}
          aria-label={label}
          aria-current={tab === id ? "page" : undefined}
        >
          <span className={styles.icon}><Icon /></span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
