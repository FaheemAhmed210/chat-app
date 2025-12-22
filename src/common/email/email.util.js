const sgMail = require("@sendgrid/mail");
const configs = require("../../../configs");

sgMail.setApiKey(configs.sendgrid.apiKey);

exports.sendContactUsEmail = async function (
  contactUsEmailPayload,
  result = {}
) {
  try {
    const { title, details, email } = contactUsEmailPayload;
    // const msg = {
    //   to: configs.sendgrid.sender,
    //   from: {
    //     email,
    //   },
    //   // templateId: configs.sendgrid.contactusEmailTemplateId,
    //   // dynamicTemplateData: {
    //   //   email,
    //   //   title,
    //   //   details,
    //   // },
    // };

    // const res = await sgMail.send(msg);

    const msg = {
      to: configs.sendgrid.sender, // Where the email will be sent (e.g., your support inbox)
      from: {
        email: "info@tomi.com", // Must be a verified sender on SendGrid
        name: "Contact Form",
      },
      replyTo: email, // Set the user email so replies go to the user
      templateId: configs.sendgrid.contactusEmailTemplateId,
      dynamicTemplateData: {
        title,
        details,
        email,
      },
    };
    const res = await sgMail.send(msg);
  } catch (ex) {
    result.ex = ex;
  } finally {
    return result;
  }
};
