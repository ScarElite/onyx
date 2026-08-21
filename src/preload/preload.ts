import { exposeOnyxBridge } from './bridge';

// The standalone app's preload: nothing but the shared bridge. V's Hub calls the
// same function from its own preload, alongside its own APIs.
exposeOnyxBridge();
