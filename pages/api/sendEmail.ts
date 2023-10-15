// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type {NextApiRequest, NextApiResponse} from "next";

import SendmailTransport from "nodemailer/lib/sendmail-transport";

const nodemailer = require("nodemailer");

type IResponse = {
  status: "success" | "failure";
  data?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IResponse>
) {
  return new Promise<void>((resolve, reject) => {
    const {author, message} = JSON.parse(req.body);

    if (author?.length === 0 || message?.length === 0) {
      res.status(401).end({
        status: "failure",
        data: "No author or message provided"
      });
      reject();
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.REACT_APP_EMAIL,
        pass: process.env.REACT_APP_PASSWORD
      }
    });
    const mailOptions = {
      from: process.env.REACT_APP_EMAIL,
      to: "leandrolescano11@gmail.com",
      subject: `Click Battle - New message from ${author}`,
      html: `Author: <b>${author}</b>
          Message: ${message}`
    };

    transporter.sendMail(
      mailOptions,
      (err: Error | null, info: SendmailTransport.SentMessageInfo) => {
        if (err) {
          res.status(500).send({status: "failure", data: err.message});
          res.end();
          reject();
        } else {
          res.status(200).send({status: "success"});
          res.end();
          resolve();
        }
      }
    );
  });
}
