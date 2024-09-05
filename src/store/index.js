import { configureStore, combineReducers } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

import widgetReducer from "../Widget/widgetSlice";
import messageReducer from "../Widget/WidgetLayout/Messages/messageSlice";


const persistConfig = {
  key: "root",
  storage,
  blacklist: [],
};

const reducers = combineReducers({
  widgetState: widgetReducer,
  messageState: messageReducer,
});



const persistedReducer = persistReducer(persistConfig, reducers);


// const store = createStore(
//   reducer,
//   composeWithDevTools(
//     applyMiddleware(...middleware)
//     // other store enhancers if any
//   )
// );  
// const middleware = [
//   // Add your middleware here, e.g.:
//   // thunkMiddleware,
//   // loggerMiddleware,
// ];

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  // devTools: process.env.NODE_ENV !== "production",
  // enhancers: [composeWithDevTools()],
});

export const persistor = persistStore(store);
