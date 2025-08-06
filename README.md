
## Getting Started
### 1. Downloading the Project as ZIP and Opening in IDE
1.  Go to the GitHub repository page.
2.  Click Code > Download ZIP.
3.  Extract the ZIP archive to a folder.
4.  Open your code editor.
5.  Select  File > Open Folder, then choose the extracted project folder.


Note: Run all the following commands in a terminal opened at the root folder of the project unless specified otherwise.

### 2. Install Dependencies
Install all dependencies listed in `package.json`, including Next.js:
```bash
npm install
```

### 3. Configure Environment Variables
Create a new file in the root of the project named .env.local, and add the following variables:
```
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

### 4. How to Get Your OpenAI API Key
1.  Go to https://platform.openai.com/account/api-keys
2.  Log in with your OpenAI account.
3.  Click Create new secret key, then copy and paste it into the ```OPENAI_API_KEY``` field in .env.local.


####  Required OpenAI Model Access
To run the application successfully, your OpenAI account must have access to the following models:
-   text-embedding-3-small   
-   gpt-4
-   gpt-4o

### 5. Start the Development Server
1. Once your environment variables are configured, run:
```bash
npm run dev
```
2. After a few seconds, the terminal will display a message similar to: 
```Local: http://localhost:3000```
3. Open the link shown in the terminal under Local to access the application in your browser.


### Live Demo 
Alternatively, this project is deployed and accessible at:
https://quiz-generator-keats.vercel.app/quiz
