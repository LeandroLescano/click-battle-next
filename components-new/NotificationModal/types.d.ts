export interface NotificationModalProps {
  show: boolean;
  onClose: VoidFunction;
  type: NotificationType;
}

export type NotificationType = "kickedOut" | "hacks" | "fullRoom";
