import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", // Ensure this is your intended model version
});

const SYSTEM_PROMPT = `
You are a system control AI agent.

Your job is to convert user requests into valid Windows shell commands.

Rules:
- Only return the command
- Do not explain
- Do not add extra text
- Example:
User: create folder test
Output: mkdir test

User: delete file test.txt
Output: del test.txt
`;

async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) return stderr;
    return stdout || "Command executed successfully.";
  } catch (err) {
    return err.message;
  }
}

export async function run(query) {
  try {
    // Send prompt as a string
    const result = await model.generateContent(SYSTEM_PROMPT + "\nUser: " + query);

    // Extract text correctly using the official SDK method
    const command = result.response.text()?.trim();
    if (!command) throw new Error("AI returned no command");

    console.log("AI Command:", command);

    // Execute the command
    const output = await executeCommand(command);
    console.log("System Output:", output);

    return output;
  } catch (error) {
    console.error("Error:", error.message);
    return error.message;
  }
}