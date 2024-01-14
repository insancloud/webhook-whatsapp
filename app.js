"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios").default;
const dotenv = require("dotenv");

dotenv.config();

const app = express().use(bodyParser.json());

app.listen(process.env.PORT || 1337, () => console.log("Webhook is listening"));

app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from;
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;

      // Extract contact information
      let contactName = req.body.entry[0].changes[0].value.contacts[0].profile.name;
      let contactWhatsAppID = req.body.entry[0].changes[0].value.contacts[0].wa_id;

      // Create acknowledgment message with contact information
      let ackMessage = `Ack: ${msg_body}\nContact Name: ${contactName}\nContact WhatsApp ID: ${contactWhatsAppID}`;

      // Send acknowledgment message back to the sender
      axios.post(
        `https://graph.facebook.com/v12.0/${phone_number_id}/messages?access_token=${process.env.WHATSAPP_TOKEN}`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: ackMessage },
        },
        { headers: { "Content-Type": "application/json" } }
      );
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});
