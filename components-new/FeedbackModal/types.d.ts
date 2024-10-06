export interface FeedbackModalProps {
  show: boolean;
  onClose: VoidFunction;
  onRequestContact: (data: ContactProps) => void;
}
