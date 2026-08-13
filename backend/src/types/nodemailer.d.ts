/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'nodemailer' {
  const nodemailer: any;
  export default nodemailer;
  export type Transporter = any;
}
