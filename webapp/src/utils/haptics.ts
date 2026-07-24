import {
  isTelegramMiniApp,
  telegramImpact,
  telegramNotification,
  telegramSelectionChanged,
} from "@/lib/telegram/telegram.ts";

function canUseVibrationApi(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function triggerIosSwitchHaptic(): void {
  const label = document.createElement("label");
  label.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.body.appendChild(label);
  input.click();
  label.remove();
}

function haptic(tg: () => void, vibration: () => void, ios?: () => void): void {
  if (isTelegramMiniApp()) { tg(); return; }
  if (canUseVibrationApi()) { vibration(); return; }
  ios?.();
}

export const hapticSpinStart = () =>
  haptic(() => telegramImpact("medium"), () => navigator.vibrate(60), triggerIosSwitchHaptic);

export const hapticSpinTick = () =>
  haptic(telegramSelectionChanged, () => navigator.vibrate(30), triggerIosSwitchHaptic);

export const hapticBarGrowTick = () =>
  haptic(telegramSelectionChanged, () => navigator.vibrate(12), triggerIosSwitchHaptic);

export const hapticTabTap = () =>
  haptic(() => telegramImpact("light"), () => navigator.vibrate(15), triggerIosSwitchHaptic);

export const hapticError = () =>
  haptic(() => telegramNotification("error"), () => navigator.vibrate([40, 30, 40, 30, 40]), triggerIosSwitchHaptic);

export const hapticSpinReveal = () =>
  haptic(() => telegramNotification("success"), () => navigator.vibrate([100, 60, 150]), triggerIosSwitchHaptic);

export function stopHaptics(): void {
  if (canUseVibrationApi()) navigator.vibrate(0);
}
