// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import SendmailTransport from "nodemailer/lib/sendmail-transport";

import nodemailer from "nodemailer";
import {EmailTemplate} from "components/EmailTemplate";

export async function POST(req: Request) {
  const {author, message} = await req.json();

  return await new Promise<void>((resolve, reject) => {
    if (author?.length === 0 || message?.length === 0) {
      return Response.json(
        {
          status: "failure",
          data: "No author or message provided"
        },
        {status: 401}
      );
      reject();
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.REACT_APP_EMAIL,
        pass: process.env.REACT_APP_PASSWORD
      }
    });

    const htmlText = EmailTemplate({author, message});

    const mailOptions = {
      from: process.env.REACT_APP_EMAIL,
      to: "leandrolescano11@gmail.com",
      subject: `Click Battle - New message from ${author}`,
      html: htmlText
    };

    return transporter.sendMail(
      mailOptions,
      (err: Error | null, info: SendmailTransport.SentMessageInfo) => {
        if (err) {
          console.error(err.message);
          reject(err);
        } else {
          console.log({info});
          resolve();
        }
      }
    );
  })
    .then(() => {
      return Response.json({status: "sucess"}, {status: 200});
    })
    .catch((e) => {
      return Response.json({status: "failure", message: e}, {status: 500});
    });
}
