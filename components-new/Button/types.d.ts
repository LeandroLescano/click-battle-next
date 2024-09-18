export interface ButtonProps {
  variant?: "primary" | "outlined";
  children: React.ReactNode;
  onClick: VoidFunction;
  className?: string;
}
