import { postToParent } from "./dom.js";
import { registerParentMessageListener } from "./event-handlers.js";

registerParentMessageListener();
postToParent({ type: "iframe-ready" });
