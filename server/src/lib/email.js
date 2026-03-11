import nodemailer from 'nodemailer';

export const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

export const getEmailFromAddress = () =>
  process.env.EMAIL_FROM || process.env.EMAIL_USER;

export const getOwnerEmail = () => process.env.EMAIL_USER;

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
