import {
  isTelegramMiniApp,
  telegramImpact,
  telegramNotification,
  telegramSelectionChanged,
} from "./api/telegram.ts";

function canUseVibrationApi(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function triggerIosSwitchHaptic() {
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

export function hapticSpinStart() {
  if (isTelegramMiniApp()) {
    telegramImpact("medium");
    return;
  }

  if (canUseVibrationApi()) {
    navigator.vibrate(60);
    return;
  }

  triggerIosSwitchHaptic();
}

export function hapticSpinTick() {
  if (isTelegramMiniApp()) {
    telegramSelectionChanged();
    return;
  }

  if (canUseVibrationApi()) {
    navigator.vibrate(30);
  }
}

export function hapticBarGrowTick() {
  if (isTelegramMiniApp()) {
    telegramSelectionChanged();
    return;
  }

  if (canUseVibrationApi()) {
    navigator.vibrate(12);
  }
}

export function hapticTabTap() {
  if (isTelegramMiniApp()) {
    telegramImpact("light");
    return;
  }

  if (canUseVibrationApi()) {
    navigator.vibrate(15);
  }
}

export function hapticSpinReveal() {
  if (isTelegramMiniApp()) {
    telegramNotification("success");
    return;
  }

  if (canUseVibrationApi()) {
    navigator.vibrate([100, 60, 150]);
    return;
  }

  triggerIosSwitchHaptic();
}

export function stopHaptics() {
  if (canUseVibrationApi()) {
    navigator.vibrate(0);
  }
}
