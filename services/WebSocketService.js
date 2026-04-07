class WebSocketService {
  constructor() {
    this.ws = null;
    this.onMessage = null;
    this.onStatus = null;
  }

  connect(url) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
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

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      if (this.onStatus) this.onStatus("disconnected");
    };

    this.ws.onerror = () => {
      console.log("WebSocket error");
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
      this.ws.close();
    }
  }
}

export default new WebSocketService();