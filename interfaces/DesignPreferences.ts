import {Timestamp} from "firebase/firestore";

export interface DesignPreference {
  likesNewDesign: boolean;
  isAnonymous: boolean;
  timestamp: Timestamp;
}
