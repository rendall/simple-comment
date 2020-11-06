import { Error } from "./simple-comment";

export const user401:Error = {
  code:401,
  message:"Bad credentials"
}

export const user404:Error = {
  code:404,
  message:"Unknown user"
}