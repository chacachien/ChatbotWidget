import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getBotResponse } from "../../../utils/helpers";
import { createBotMessage } from "../../../utils/helpers";

export const fetchBotResponse = createAsyncThunk(
  "messages/fetchBotResponse",
  async (payload, thunkAPI) => {
    //const response = await getBotResponse(payload);
    const testData = {
      content: payload.message,
      chatId: 2,
      role: 1,
      courseId: 11,
    };
    const response = await fetch(payload.rasaServerUrl, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      method: "POST",
      body: JSON.stringify(testData),
    });

    const reader = response.body.getReader();
    let isBotTyping = true;
    const decoder = new TextDecoder();
    thunkAPI.dispatch(setBotStream(""));
    while (isBotTyping) {
      const { done, value } = await reader.read();
      if (done) {
        isBotTyping = false;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log("chunk", chunk);

      // Dispatch each chunk as it arrives
      thunkAPI.dispatch(updateBotStream(chunk));
    }

    thunkAPI.dispatch(toggleBotTyping(false));
    console.log("bot response", response);
    await new Promise((r) => setTimeout(r, 1000));
    return response;
  }
);

export const resetBot = createAsyncThunk(
  "messages/resetBot",
  async (payload, thunkAPI) => {
    await getBotResponse(payload);
  }
);

const initialState = {
  messages: [],
  botTyping: false,
  userTyping: true,
  userTypingPlaceholder: "Type your message here...",
  userGreeted: false,
  botStream: ""
};
export const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      if (action.payload.sender === "USER") {
        state.messages = state.messages.map((message) => {
          if (message.type === "custom") {
            if (message.text) {
              message = {
                text: message.text,
                sender: "BOT",
                type: "text",
                ts: message.ts,
              };
            }
          }
          if (message.type === "buttons") {
            message.quick_replies = [];
          }
          return message;
        });
      }
      state.messages.push(action.payload);
    },
    setBotStream: (state, action) => {
      state.botStream = action.payload;
    },
    updateBotStream: (state, action) => {
      console.log("Updating botStream with:", action.payload); // Add this line
      state.botStream += action.payload; // Append new chunk to botStream
      console.log("Updated botStream:", state.botStream); // Add this line
    },
    finalizeBotMessage: (state) => {
      // Add final botStream data as a message
      state.messages.push({
        text: state.botStream,
        sender: "BOT",
        type: "text",
        ts: new Date(),
      });
      state.botStream = ""; // Clear botStream after finalizing
    },
    resetMessageState: () => {
      return initialState;
    },
    removeAllMessages: (state) => {
      state.messages = [];
    },
    disableButtons: (state, action) => {
      const index = action.payload;
      state.messages[index].callback = false;
    },
    toggleUserTyping: (state, action) => {
      state.userTyping = action.payload;
    },
    toggleBotTyping: (state, action) => {
      state.botTyping = action.payload;
      state.userTypingPlaceholder = action.payload
        ? "Please wait for bot response..."
        : "Type your message here...";
    },
    setUserTypingPlaceholder: (state, action) => {
      state.userTypingPlaceholder = action.payload;
    },
    setUserGreeted: (state, action) => {
      state.userGreeted = action.payload;
    },
    extraReducers: (builder) => {
      builder.addCase(fetchBotResponse.fulfilled, (state) => {
        // Finalize bot message when streaming is done
        state.botTyping = false;
        state.userTyping = true;
        state.userTypingPlaceholder = "Type your message here...";
        state.messages.push({
          text: state.botStream,
          sender: "BOT",
          type: "text",
          ts: new Date(),
        });
        state.botStream = "";
      });
    },
  },
  // extraReducers: (builder) => {
  //   builder.addCase(fetchBotResponse.fulfilled, (state, action) => {
  //     state.botTyping = false;
  //     state.userTyping = true;
  //     state.userTypingPlaceholder = "Type your message here...";
  //     let messages = action.payload;
  //     console.log("payload1: ", action.payload);

  //     if (messages.length > 0) {
  //       for (let index = 0; index < messages.length; index += 1) {
  //         const message = messages[index];
  //         // messageType: text
  //         if (message) {
  //           // state.messages.push({
  //           //   text: message,
  //           //   sender: "BOT",
  //           //   type: "text",
  //           //   ts: new Date(),
  //           // });
  //           state.messages[state.messages.length - 1].text += action.payload;
  //           console.log("payload: ", action.payload)
  //         }

  //         // messageType: image
  //         if (message?.image) {
  //           state.messages.push({
  //             src: message.image,
  //             sender: "BOT",
  //             type: "image",
  //             ts: new Date(),
  //           });
  //         }

  //         // messageType: buttons
  //         if (message?.buttons) {
  //           if (message.buttons.length > 0) {
  //             state.messages.push({
  //               buttons: message.buttons,
  //               sender: "BOT",
  //               type: "buttons",
  //               ts: new Date(),
  //               callback: true,
  //             });
  //           }
  //         }
  //       }
  //     } else {
  //       state.messages.push({
  //         text: "Unfortunately, I'm having some problem 😅. I would appreciate it if you could try again later",
  //         sender: "BOT",
  //         type: "text",
  //         ts: new Date(),
  //       });
  //     }
  //   });
  //},
});

export const {
  addMessage,
  setBotStream,
  updateBotStream,
  removeAllMessages,
  finalizeBotMessage,
  toggleBotTyping,
  toggleUserTyping,
  setUserTypingPlaceholder,
  setUserGreeted,
  resetMessageState,
  disableButtons,
} = messagesSlice.actions;

export default messagesSlice.reducer;
