import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment, ModelType } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { Icons } from './components/Icon';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { FilePreview } from './components/FilePreview';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I'm your Gemini Code Assistant. \n\nI can help you analyze code files, debug issues, and architect solutions.\n\n**To get started:**\n1. Type a question below.\n2. **Upload your code files** directly (Multiple files supported!).\n3. Ask me to explain, refactor, or debug them.",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // Simple logic to detect text/code files
        // We assume anything not image/audio/video is text for the purpose of coding assistant
        const isImage = file.type.startsWith('image/');
        const isText = !isImage && !file.type.startsWith('audio/') && !file.type.startsWith('video/');

        const reader = new FileReader();
        
        const content = await new Promise<string>((resolve) => {
          if (isText) {
            reader.readAsText(file);
          } else {
            reader.readAsDataURL(file);
          }
          reader.onload = () => resolve(reader.result as string);
        });

        newAttachments.push({
          name: file.name,
          type: file.type || 'text/plain',
          content,
          isText
        });
      }
      
      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Prepare history for API
      // We limit context window slightly to ensure we don't blow token limits with massive files too quickly in this demo
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }] 
      }));

      const responseText = await sendMessageToGemini(
        userMessage.content,
        userMessage.attachments || [],
        selectedModel,
        history
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error processing your request. Please check your API key or try again.",
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto bg-gray-950 shadow-2xl overflow-hidden md:border-x md:border-gray-800">
      
      {/* Header */}
      <header className="flex-none bg-gray-900/50 backdrop-blur-md border-b border-gray-800 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Icons.Code className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Gemini Code Studio</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setSelectedModel(ModelType.FLASH)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              selectedModel === ModelType.FLASH 
                ? 'bg-gray-800 text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icons.Zap size={14} />
            Flash 2.5
          </button>
          <button
            onClick={() => setSelectedModel(ModelType.PRO)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
              selectedModel === ModelType.PRO 
                ? 'bg-gray-800 text-purple-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icons.Cpu size={14} />
            Pro 3.0
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Avatar for Bot */}
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-1">
                <Icons.Bot size={16} className="text-white" />
              </div>
            )}

            <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-5 py-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.isError 
                      ? 'bg-red-900/20 border border-red-800 text-red-200 rounded-bl-none'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-none'
                }`}
              >
                {/* Attachments Display for User Message */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-white/20">
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded text-xs">
                        {att.isText ? <Icons.FileText size={12}/> : <Icons.Image size={12}/>}
                        <span className="truncate max-w-[150px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {msg.role === 'model' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>

              {/* Timestamp/Role Label */}
              <span className="text-[10px] text-gray-500 px-1">
                {msg.role === 'user' ? 'You' : selectedModel.replace('gemini-', '')} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>

            {/* Avatar for User */}
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mt-1">
                <Icons.User size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-4xl mx-auto">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-1">
              <Icons.Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-900 border border-gray-800 px-5 py-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <Icons.Spinner className="animate-spin text-blue-500" size={18} />
              <span className="text-sm text-gray-400">Analyzing code...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-gray-900 border-t border-gray-800">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          
          {/* Attachments Preview Area */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {attachments.map((att, idx) => (
                <FilePreview 
                  key={idx} 
                  attachment={att} 
                  onRemove={() => removeAttachment(idx)} 
                />
              ))}
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-gray-950 p-2 rounded-xl border border-gray-800 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-lg">
            
            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Upload code files or images"
            >
              <Icons.Paperclip size={20} />
            </button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Text Input */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachments.length > 0 ? "Ask about these files..." : "Paste code, ask a question, or upload files..."}
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm p-3 max-h-32 min-h-[48px] resize-none focus:outline-none scrollbar-thin scrollbar-thumb-gray-700"
              rows={1}
              style={{ minHeight: '48px', height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
              className={`p-3 rounded-lg transition-all duration-200 ${
                (!inputValue.trim() && attachments.length === 0) || isLoading
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30'
              }`}
            >
              {isLoading ? <Icons.Spinner className="animate-spin" size={20} /> : <Icons.Send size={20} />}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-gray-500">
              Supports: JS, TS, Python, HTML, CSS, & Images. Tip: Upload multiple files to give the AI full context.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
