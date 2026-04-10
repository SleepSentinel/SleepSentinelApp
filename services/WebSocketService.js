class WebSocketService {
  constructor() {
    this.ws = null;
    this.onMessage = null;
    this.onStatus = null;
  }

  connect(url) {
    this.disconnect();
    this.ws = new WebSocket(url);
    if (this.onStatus) this.onStatus(`connecting to ${url}`);

    this.ws.onopen = () => {
      console.log("WebSocket connected:", url);
      if (this.onStatus) this.onStatus("connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(data);
      } catch (e) {
        console.log("Invalid JSON:", event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket disconnected", event);
      if (this.onStatus) this.onStatus("disconnected");
    };

    this.ws.onerror = (event) => {
      console.log("WebSocket error", event);
      if (this.onStatus) this.onStatus("error");
    };
  }

  setMessageCallback(callback) {
    this.onMessage = callback;
  }

  setStatusCallback(callback) {
    this.onStatus = callback;
  }

  disconnect() {
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;

      if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        socket.close();
      }
    }
  }
}

export default new WebSocketService();
