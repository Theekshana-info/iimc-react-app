import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressively unregister any stray Service Workers from other local projects
// that might be intercepting and hanging fetch requests on localhost:8080.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
      console.log('[App] Unregistered rogue service worker:', registration);
    }
  }).catch(err => console.error('Service Worker unregistration error:', err));
}

createRoot(document.getElementById("root")!).render(<App />);
