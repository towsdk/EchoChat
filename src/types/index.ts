export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  messageText: string;
  sender: string;
  decision: 'Forwarded' | 'Blocked';
  reason: string;
  timestamp: string;
}
