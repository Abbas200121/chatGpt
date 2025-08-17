# ChatGPT-App

### **ChatGPT-App Development Progress**

## Studying Full-Stack Development and API Usage – 8 Hours

Learned how to build a full-stack application, studied API structures, requests, and responses, and
explored integrating external APIs with FastAPI.

## Backend Development and AI Response System – 20 Hours

Developed the backend using FastAPI, implemented an endpoint to receive user messages, integrated the
Hugging Face API for AI-generated responses, and designed database models connected to MySQL for message
storage.

## Testing Backend with Postman – 2 Hours

Used Postman to send API requests and verify responses, identified and fixed errors in request handling
and API responses.

## Frontend Development – 10 Hours

Built a React.js UI to send and display messages, connected the frontend to the FastAPI backend,
developed models and API services to handle requests, and displayed AI responses properly in the chat
interface.

## Improving AI Response Display and UI – 3 Hours

Changed how AI responses are displayed from instant appearance to a dynamic, human-like typing effect,
improved UI styling, and enhanced message animations for a better user experience.

## Implementing Authentication (Login & Signup) – 10 Hours

Implemented JWT authentication for user login and signup, enforced authentication so that only logged-in
users can send messages, used password hashing to store passwords securely in MySQL, and fixed issues
where the server sometimes failed to send tokens or encountered authentication errors.

## Enhancing Chat Storage – 8 Hours

Implemented per-user chat history storage, ensuring each user sees only their own previous chats upon
login. Enhanced the backend to fetch and display user-specific chats so that users can review old
messages after logging in.

## Multi-Session Chat Support – 15 Hours

Modified the backend to allow users to create multiple chat sessions while keeping all their past chats
intact. Updated the frontend to display a list of active user chats, making it easy to switch between
conversations seamlessly.

## Google Authentication and Logout – 10 Hours

Integrated Google OAuth for authentication, allowing users to log in with their Google accounts. Fixed
issues with token handling and ensured that users remain authenticated after logging in. Added a logout
button to allow users to clear their session securely.

## Fixing Authentication Issues and Token Handling – 4 Hours

Resolved issues with JWT tokens not being sent properly during login. Ensured tokens are correctly stored
and retrieved on the frontend. Fixed bugs where some authentication requests were failing due to
incorrect token handling in FastAPI middleware.

## 🌙 Dark and Light Theme Support – 6 Hours

Added a dark/light mode toggle using local storage to persist the selected theme across sessions. Updated
UI components to adapt their styles based on the selected theme, improving accessibility and personal
preference.

## 📄 Export Chat to PDF – 5 Hours

Implemented a feature to export the chat history to a PDF file. Added a new button to trigger the export,
and used `jsPDF` to generate downloadable PDFs including both user and bot messages. Ensured formatting
and layout look clean in the exported document.

## The section above reflects work done by my project partner. The following hours and tasks represent my

personal contribution to the project.

## Studying Full-Stack Development and API Usage and the project – 10 Hours

Learned how to build a full-stack application, studied API structures, requests, and responses, and
explored integrating external APIs with FastAPI.

## switching from Hugging Face to OpenRouter – 8 Hours

After facing persistent 404 errors with Hugging Face's Inference API, I researched alternatives and
discovered [OpenRouter.ai]. I integrated OpenRouter into the backend, replacing the previous model. It
provides stable, high-quality text generation responses and significantly improved the reliability of the
system.

## Adding Image Generation with Stable Horde –20 Hours

Implemented a new feature that allows users to generate images from prompts using the Stable Horde API.
Built a new FastAPI endpoint to send prompts and poll for results. Updated the frontend to allow toggling
between text and image generation modes and display image replies inside the chat interface.

## 💬 Message Saving for Generated Images – 2 Hours

Integrated image generation into the chat history system. When a user generates an image, the prompt and
image URL are saved in the same way as text messages. This enables consistent user experience and chat
continuity across all content types.

## 🧪 Robust Polling & Error Handling – 2 Hours

Improved error handling and retry logic when polling for image generation results. Ensured timeouts and
failed generations return helpful feedback to the user. Added debug logs for tracking API response status
and troubleshooting failures.

## ⚙️ Database Upgrade – 1 Hour

Upgraded the MySQL messages.response column from VARCHAR to LONGTEXT to support large AI-generated texts
and long image URLs. This resolved "Data too long" errors and made the app more stable when handling
large responses, and also add new columns.

## 🎛️ Mode Toggle & Frontend Integration – 6 Hours

Created a user interface toggle for switching between text and image generation modes. Adjusted frontend
logic to call the appropriate backend endpoints based on the selected mode. Used dangerouslySetInnerHTML
to display generated image tags directly in the chat.

## AI Suggestions After Reply – 6 Hours

After each AI response, the frontend now automatically queries a new /suggestions endpoint to fetch
related follow-up questions or ideas. These are shown as clickable buttons under the response, allowing
users to continue the conversation with a single click. This improves usability and encourages extended
interaction with the chatbot.

## Voice-to-Text (Microphone Input) – 12 Hours

Extended the speech recognition feature with a pulsing animation to indicate when the microphone is
actively recording. Improved usability by dynamically adapting the recording language to match the
selected UI language. These changes make the interface more intuitive and accessible for multilingual
users.

## Language Toggle (English / Arabic / Hebrew) – 4 Hours

Implemented a button to toggle the interface and voice input/output language among English, Arabic, and
Hebrew. The app updates both the speech recognition and speech synthesis voices accordingly, offering
better accessibility for multilingual users.

## Upload Image Support – 12 Hours

Enabled users to upload image files into the chat. Uploaded images are previewed inline in the message
list and sent to the backend, where they can be processed or stored. This expands the chatbot’s
capability beyond text-only conversations.

## Chat Search and Highlight – 7 Hours

Implemented a search bar that allows users to search through past messages. All matching messages are
automatically highlighted inside the chat view. This makes it easy to review previous content, especially
in long conversations.

## AI Image Understanding (BLIP Captioning) – 15 Hours

Implemented a feature that allows users to upload an image and receive an AI-generated description. When
an image is uploaded, it’s sent to a backend endpoint that uses the Salesforce BLIP model via Hugging
Face to generate a caption. The response is saved in the chat and displayed under the image. This adds
visual intelligence to the chatbot and enables rich image-based conversations.

## Admin Panel for User & Chat Management – 17 Hours

Implemented a full admin dashboard where administrators can view all registered users, explore their chat
sessions, and inspect or delete specific messages. The panel features a clean, interactive design built
with Tailwind CSS and Framer Motion. Backend access is restricted to verified admin users, ensuring
secure moderation and full control over chat data.

## Export All Chats to ZIP – 15 Hours

Implemented a feature that allows users to download all their chat sessions as a ZIP file. Each chat is
saved as a separate .txt file, and the ZIP is generated dynamically using server-side logic. The frontend
provides a clear “Export ZIP” button styled for accessibility. This feature enhances data portability,
making it easy for users to archive or review their full chat history offline.
