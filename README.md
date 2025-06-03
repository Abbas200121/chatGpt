# ChatGPT-App

## ali hours and what i did is down

## Abbas

### **ChatGPT-App Development Progress**

## Studying Full-Stack Development and API Usage – 8 Hours

Learned how to build a full-stack application, studied API structures, requests, and responses, and explored integrating external APIs with FastAPI.

## Backend Development and AI Response System – 20 Hours

Developed the backend using FastAPI, implemented an endpoint to receive user messages, integrated the Hugging Face API for AI-generated responses, and designed database models connected to MySQL for message storage.

## Testing Backend with Postman – 2 Hours

Used Postman to send API requests and verify responses, identified and fixed errors in request handling and API responses.

## Frontend Development – 10 Hours

Built a React.js UI to send and display messages, connected the frontend to the FastAPI backend, developed models and API services to handle requests, and displayed AI responses properly in the chat interface.

## Improving AI Response Display and UI – 3 Hours

Changed how AI responses are displayed from instant appearance to a dynamic, human-like typing effect, improved UI styling, and enhanced message animations for a better user experience.

## Implementing Authentication (Login & Signup) – 10 Hours

Implemented JWT authentication for user login and signup, enforced authentication so that only logged-in users can send messages, used password hashing to store passwords securely in MySQL, and fixed issues where the server sometimes failed to send tokens or encountered authentication errors.

## Enhancing Chat Storage – 8 Hours

Implemented per-user chat history storage, ensuring each user sees only their own previous chats upon login. Enhanced the backend to fetch and display user-specific chats so that users can review old messages after logging in.

## Multi-Session Chat Support – 15 Hours

Modified the backend to allow users to create multiple chat sessions while keeping all their past chats intact. Updated the frontend to display a list of active user chats, making it easy to switch between conversations seamlessly.

## Google Authentication and Logout – 10 Hours

Integrated Google OAuth for authentication, allowing users to log in with their Google accounts. Fixed issues with token handling and ensured that users remain authenticated after logging in. Added a logout button to allow users to clear their session securely.

## Fixing Authentication Issues and Token Handling – 4 Hours

Resolved issues with JWT tokens not being sent properly during login. Ensured tokens are correctly stored and retrieved on the frontend. Fixed bugs where some authentication requests were failing due to incorrect token handling in FastAPI middleware.

## 🌙 Dark and Light Theme Support – 6 Hours

Added a dark/light mode toggle using local storage to persist the selected theme across sessions. Updated UI components to adapt their styles based on the selected theme, improving accessibility and personal preference.

## 📄 Export Chat to PDF – 5 Hours

Implemented a feature to export the chat history to a PDF file. Added a new button to trigger the export, and used `jsPDF` to generate downloadable PDFs including both user and bot messages. Ensured formatting and layout look clean in the exported document.

## The section above reflects work done by my project partner. The following hours and tasks represent my personal contribution to the project.

## ALi

## Studying Full-Stack Development and API Usage and the project – 10 Hours

Learned how to build a full-stack application, studied API structures, requests, and responses, and explored integrating external APIs with FastAPI.

## witching from Hugging Face to OpenRouter – 8 Hours

After facing persistent 404 errors with Hugging Face's Inference API, I researched alternatives and discovered [OpenRouter.ai]. I integrated OpenRouter into the backend, replacing the previous model. It provides stable, high-quality text generation responses and significantly improved the reliability of the system.

## 🖼️ Adding Image Generation with Stable Horde – 18 Hours

Implemented a new feature that allows users to generate images from prompts using the Stable Horde API. Built a new FastAPI endpoint to send prompts and poll for results. Updated the frontend to allow toggling between text and image generation modes and display image replies inside the chat interface.

## 💬 Message Saving for Generated Images – 2 Hours

Integrated image generation into the chat history system. When a user generates an image, the prompt and image URL are saved in the same way as text messages. This enables consistent user experience and chat continuity across all content types.

## 🧪 Robust Polling & Error Handling – 2 Hours

Improved error handling and retry logic when polling for image generation results. Ensured timeouts and failed generations return helpful feedback to the user. Added debug logs for tracking API response status and troubleshooting failures.

## ⚙️ Database Upgrade – 1 Hour

Upgraded the MySQL messages.response column from VARCHAR to LONGTEXT to support large AI-generated texts and long image URLs. This resolved "Data too long" errors and made the app more stable when handling large responses.

## 🎛️ Mode Toggle & Frontend Integration – 6 Hours

Created a user interface toggle for switching between text and image generation modes. Adjusted frontend logic to call the appropriate backend endpoints based on the selected mode. Used dangerouslySetInnerHTML to display generated image tags directly in the chat.
