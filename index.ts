import * as restify from "restify";

import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  ConfigurationBotFrameworkAuthentication,
  TurnContext,
} from "botbuilder";

import { TeamsBot } from "./teamsBot";
import config from "./config";
import axios from "axios";
import { validateAuth } from "./functions/functions";

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: config.botId,
  MicrosoftAppPassword: config.botPassword,
  MicrosoftAppType: "MultiTenant",
});

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(
  {},
  credentialsFactory
);

const adapter = new CloudAdapter(botFrameworkAuthentication);

const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  if (context.activity.type === "message") {
    await context.sendTraceActivity(
      "OnTurnError Trace",
      `${error}`,
      "https://www.botframework.com/schemas/error",
      "TurnError"
    );

    await context.sendActivity(
      `The bot encountered unhandled error:\n ${error.message}`
    );
    await context.sendActivity(
      "To continue to run this bot, please fix the bot source code."
    );
  }
};

adapter.onTurnError = onTurnErrorHandler;

const bot = new TeamsBot();

const server = restify.createServer();
server.use(restify.plugins.bodyParser());
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

function convertToCamelCase(userId: string): string {
  return userId
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
}

server.post("/api/messages", async (req, res) => {
  await adapter.process(req, res, async (context) => {
    console.log(context.activity);
    if (context.activity.text) {
      try {
        // const { access_token, expires_in } = await validateAuth();

        const chatPayLoad = {
          message: context.activity.text,
          teamsUser: convertToCamelCase(context.activity.from.id),
          modelType: 1,
        };

        // const piiResponse = await axios.post(
        //   `http://localhost:8080/chat/send_message`,
        //   chatPayLoad,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${access_token}`,
        //     },
        //   }
        // );

        // await context.sendActivity(
        //   piiResponse.data.pythonApiResponse.deanon_response
        // );
      } catch (error) {
        console.error("Failed to call the NestJS service:", error.message);
        await context.sendActivity(
          "Sorry, something went wrong while processing your request."
        );
      }
    }
  });
});
