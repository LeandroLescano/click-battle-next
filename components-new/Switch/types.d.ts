export interface SwitchProps {
  label?: string;
  labelClassName?: string;
  containerClassName?: string;
  className?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}
