interface EmailTemplateProps {
  author: string;
  message: string;
}

export const EmailTemplate = ({
  author,
  message
}: EmailTemplateProps) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedback Email</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f75580;
      color: #382b22;
    }
    .container {
      max-width: 600px;
      margin: 2rem auto;
      background-color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    .from {
      font-weight: bold;
      margin-bottom: 1rem;
    }
    .message {
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      font-size: 0.8rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body >
  <div style="font-family: sans-serif;margin: 0;padding: 2em;background-color: #f75580;color: #382b22;border-radius: 4px;">
  <div style="max-width: 600px; margin: 2rem auto; background-color: #fff; border-radius: 4px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); padding: 2rem;">
    <p style="font-weight: bold; margin-bottom: 1rem;">From: ${author}</p>
    <p style="white-space: pre-wrap;">${message}</p>
  </div>
  <div style="text-align: center; font-size: 1em; margin-top: 1rem;color: #fff">
    <p>&copy; Click Battle</p>
  </div>
     </div>
</body>
</html>
`;
