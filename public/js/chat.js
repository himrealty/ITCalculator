// public/js/chat.js
// Calls /api/chat on our Express server — Groq key stays server-side

class TaxChatbot {
  constructor(config) {
    this.apiUrl     = '/api/chat';
    this.containerId = config.containerId || 'chatContainer';
    this.messages   = [];
    this.isTyping   = false;
    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
    this.addMessage('assistant', '👋 Hi! I\'m your Indian Income Tax assistant for FY 2024-25. Ask me anything about salary, capital gains, deductions, or tax regimes!');
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <h3>🤖 Tax Assistant</h3>
          <span class="chat-badge">Powered by Groq</span>
        </div>
        <div class="chat-messages" id="chatMessages-${this.containerId}"></div>
        <div class="chat-input-area">
          <input type="text"
                 class="chat-input"
                 id="chatInput-${this.containerId}"
                 placeholder="Ask about HRA, 80C, capital gains, tax slabs..." />
          <button class="chat-send" id="chatSend-${this.containerId}">Send</button>
        </div>
        <div class="chat-footer" id="typing-${this.containerId}" style="display:none;">
          <span class="typing-indicator">AI is thinking...</span>
        </div>
      </div>
    `;

    this.messagesContainer = document.getElementById(`chatMessages-${this.containerId}`);
    this.inputField        = document.getElementById(`chatInput-${this.containerId}`);
    this.sendButton        = document.getElementById(`chatSend-${this.containerId}`);
    this.typingIndicator   = document.getElementById(`typing-${this.containerId}`);
  }

  attachEvents() {
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  async sendMessage() {
    const message = this.inputField.value.trim();
    if (!message || this.isTyping) return;

    this.inputField.value = '';
    this.addMessage('user', message);
    this.setTyping(true);

    try {
      const history = this.messages
        .slice(-6)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationHistory: history })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const data = await response.json();
      this.addMessage('assistant', data.response);

    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('assistant', '⚠️ Sorry, I encountered an error. Please try again.');
    } finally {
      this.setTyping(false);
    }
  }

  addMessage(type, content) {
    const message = { type, content, timestamp: new Date() };
    this.messages.push(message);

    const el = document.createElement('div');
    el.className = `chat-message ${type}-message`;
    el.innerHTML = `
      <div class="message-avatar">${type === 'user' ? '👤' : '🤖'}</div>
      <div class="message-content">${this.formatMessage(content)}</div>
    `;

    this.messagesContainer.appendChild(el);
    this.scrollToBottom();
  }

  formatMessage(content) {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  setTyping(typing) {
    this.isTyping = typing;
    this.typingIndicator.style.display = typing ? 'block' : 'none';
    this.sendButton.disabled = typing;
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chatContainer')) {
    window.taxChatbot = new TaxChatbot({ containerId: 'chatContainer' });
  }
});
