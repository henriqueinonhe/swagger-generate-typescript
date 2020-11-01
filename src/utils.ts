import { Reference } from "./models";

export function capitalize(str : string) : string {
  return str[0].toUpperCase() + str.slice(1);
}

export function isReference(object : any) : object is Reference {
  return "$ref" in object;
}