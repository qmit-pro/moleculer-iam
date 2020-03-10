import { LinkingOptions } from "@react-navigation/native/lib/typescript/src/types";
import { getAppPrefix } from "../../inject";

let prefix = getAppPrefix();
prefix = prefix.startsWith("/") ? prefix.substr(1) : prefix;

export const routeConfig: NonNullable<LinkingOptions["config"]> = {
  "login.stack": {
    screens: {
      "login.check_password": `${prefix}/login/check_password`,
      "login.index": `${prefix}/login`,
    },
  },
  "consent.stack": {
    screens: {
      "consent.index": `${prefix}/consent`,
    },
  },
  "logout.stack": {
    screens: {
      "logout.end": `${prefix}/session/end/success`,
      "logout.index": `${prefix}/session/end`,
    },
  },
  "find_email.stack": {
    screens: {
      "find_email.end": `${prefix}/find_email/end`,
      "find_email.index": `${prefix}/find_email`,
    },
  },
  "reset_password.stack": {
    screens: {
      "reset_password.end": `${prefix}/reset_password/end`,
      "reset_password.set": `${prefix}/reset_password/set`,
      "reset_password.index": `${prefix}/reset_password`,
    },
  },
  "register.stack": {
    screens: {
      "register.end": `${prefix}/register/end`,
      "register.detail": `${prefix}/register/detail`,
      "register.index": `${prefix}/register`,
    },
  },
  "verify_phone.stack": {
    screens: {
      "verify_phone.end": `${prefix}/verify_phone/end`,
      "verify_phone.verify": `${prefix}/verify_phone/verify`,
      "verify_phone.index": `${prefix}/verify_phone`,
    },
  },
  "verify_email.stack": {
    screens: {
      "verify_email.end": `${prefix}/verify_email/end`,
      "verify_email.verify": `${prefix}/verify_email/verify`,
      "verify_email.index": `${prefix}/verify_email`,
    },
  },
  "error.stack": {
    screens: {
      "error.index": "",
    },
  },
};