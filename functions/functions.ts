import axios from "axios";
import dotenv from "dotenv";
import Redis from "ioredis";
import { createClient } from "redis";
import { CardFactory } from "botbuilder";

dotenv.config();

interface LoginResponse {
  access_token: string;
  expires_in: number;
}

// Set up Redis client

const TOKEN_KEY = "auth_token";
const EXPIRES_IN_KEY = "expires_in";

export async function validateAuth() {
  // const redis = await createClient()
  //   .on("error", (err) => console.log("Redis Client Error", err))
  //   .connect();
  // Check if token is cached in Redis
  // // const cachedToken = await redis.get(TOKEN_KEY);
  // const cachedExpiry = await redis.get(EXPIRES_IN_KEY);

  // if (cachedToken && cachedExpiry && Date.now() < Number(cachedExpiry)) {
  //   console.log("Using cached token");
  //   return {
  //     access_token: cachedToken,
  //     expires_in: Number(cachedExpiry) - Date.now(),
  //   };
  }

  // If token not found or expired, call login API
  const payload = {
    email: "slackuser@invisiq.com",
    password: "slackuser123456789",
  };

  console.log("Fetching new token from login API...");

  const response = await axios.post(
    "http://localhost:8080/auth/login",
    payload
  );

  if (response.data.session) {
    const token = response.data.session.access_token;
    const expiresIn = response.data.session.expires_in;

    // Store token and expiry in Redis
    const expiryTimestamp = Date.now() + expiresIn * 1000;
    await redis.set(TOKEN_KEY, token);
    await redis.set(EXPIRES_IN_KEY, expiryTimestamp.toString());

    return { access_token: token, expires_in: expiresIn };
  } else {
    throw new Error("Login failed");
  }
}

export function createModelSelectorCard() {
  return CardFactory.heroCard(
    "Please select a model type to continue:", // Card title
    undefined, // No images
    [
      {
        type: "imBack",
        title: "Model 1",
        value: { modelType: 1 }, // Set modelType to 1
      },
      {
        type: "imBack",
        title: "Model 2",
        value: { modelType: 2 }, // Set modelType to 2
      },
      {
        type: "imBack",
        title: "Model 3",
        value: { modelType: 3 }, // Set modelType to 3
      },
    ]
  );
}
