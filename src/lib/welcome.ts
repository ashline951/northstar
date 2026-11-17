/** Fired by the "Watch the Northstar video" menu item; WelcomeGate listens. */
export function replayWelcomeVideo(): void {
  window.dispatchEvent(new CustomEvent("ns:replay-welcome"));
}
