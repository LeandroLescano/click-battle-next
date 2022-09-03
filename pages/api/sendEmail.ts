// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import SendmailTransport from "nodemailer/lib/sendmail-transport";

const nodemailer = require("nodemailer");

type IResponse = {
  status: "success" | "failure";
  data?: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<IResponse>
) {
  const { author, message } = JSON.parse(req.body);
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.REACT_APP_EMAIL,
      pass: process.env.REACT_APP_PASSWORD,
    },
  });
  let mailOptions = {
    from: process.env.REACT_APP_EMAIL,
    to: "leandrolescano11@gmail.com",
    subject: `Click Battle - New message from ${author}`,
    html: `Author: <b>${author}</b> 
          Message: ${message}`,
  };

  return transporter.sendMail(
    mailOptions,
    (err: Error | null, info: SendmailTransport.SentMessageInfo) => {
      if (err) {
        res.status(500).json({ status: "failure", data: err.message });
      } else {
        res.status(200).json({ status: "success" });
      }
    }
  );
}
