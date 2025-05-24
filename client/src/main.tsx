import { createRoot } from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./index.css";

createRoot(document.getElementById("root")!).render(
<GoogleOAuthProvider clientId="43626213410-oulk09qclpck2mbdrl94vasintq3di36.apps.googleusercontent.com">
    <App />
</GoogleOAuthProvider>
);
