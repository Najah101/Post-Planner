/** Re-mounts on every navigation, so each view eases in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="rise-in">{children}</div>;
}
