import { postToParent } from "./dom.js";
import { registerParentMessageListener } from "./event-handlers.js";
import { installGlobalErrorHandler } from "./error-handler.js";

installGlobalErrorHandler();
registerParentMessageListener();
postToParent({ type: "iframe-ready" });
