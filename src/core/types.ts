export interface ParsedTime {
  h: number;
  m: number;
  s: number;
}

export type TimeView = 'picker' | 'hours' | 'minutes' | 'seconds';
export type TimeFormat = '24h' | '12h';
export type AmPm = 'AM' | 'PM';
export type ThemeOption = 'light' | 'dark' | 'auto';
export type PositionOption = 'auto' | 'top' | 'bottom' | 'left' | 'right';
export type ParseStrategy = 'right-fill' | 'left-fill' | 'smart';
export type AnimationOption = 'fade' | 'slide' | 'none';
export type CloseReason = 'select' | 'escape' | 'outside' | 'api';

export interface TimepickerChangeEvent {
  value: string;
  date: Date | null;
  formatted: string;
  prev: string;
}

export interface TimepickerError {
  code: 'INVALID_TIME' | 'BELOW_MIN' | 'ABOVE_MAX' | 'DISABLED' | 'CANCELLED';
  message: string;
  value: string;
}

export interface LocaleConfig {
  title: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  amLabel: string;
  pmLabel: string;
  nowLabel: string;
  clearLabel: string;
  confirmLabel: string;
}

export type DisabledTimesFn = (time: string) => boolean | Promise<boolean>;

export interface CellRenderResult {
  className?: string | string[];
  clickable?: boolean;
  title?: string;
}

export type CellRenderer = (time: string) => CellRenderResult | Promise<CellRenderResult>;

export interface TimepickerOptions {
  // Format
  format?: string;
  locale?: string | LocaleConfig;

  // Value
  value?: string | Date | null;
  defaultValue?: string | Date | null;
  minTime?: string;
  maxTime?: string;
  disabledTimes?: string[] | DisabledTimesFn;
  renderCell?: CellRenderer;

  // Steps
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;

  // UI / Position
  theme?: ThemeOption;
  position?: PositionOption;
  container?: HTMLElement;
  zIndex?: number;
  animation?: AnimationOption;

  // Buttons / chrome
  showClearButton?: boolean;
  showNowButton?: boolean;
  showConfirmButton?: boolean;
  showToggleIcon?: boolean;

  // Behavior
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  readonlyInput?: boolean;
  allowManualInput?: boolean;
  parseStrategy?: ParseStrategy;
  autofill?: boolean;
  emptyOk?: boolean;
  strictMode?: boolean;

  // Async lifecycle
  onBeforeOpen?: () => boolean | Promise<boolean>;
  onBeforeChange?: (next: string, prev: string) => boolean | Promise<boolean>;
  validate?: (value: string) => boolean | string | Promise<boolean | string>;

  // Sync callbacks
  onOpen?: () => void;
  onClose?: (reason: CloseReason) => void;
  onChange?: (value: string, e: TimepickerChangeEvent) => void;
  onInput?: (rawValue: string) => void;
  onInvalid?: (err: TimepickerError) => void;
  onViewChange?: (view: TimeView) => void;
}

export type TimepickerEventName =
  | 'vtp:beforeopen'
  | 'vtp:open'
  | 'vtp:close'
  | 'vtp:input'
  | 'vtp:beforechange'
  | 'vtp:change'
  | 'vtp:invalid'
  | 'vtp:hourselect'
  | 'vtp:minuteselect'
  | 'vtp:secondselect'
  | 'vtp:viewchange'
  | 'vtp:destroy';

export type EventHandler<T = unknown> = (detail: T) => void;
