export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  content: string; // Base64 for images, raw text for code
  isText: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  model: ModelType;
}
