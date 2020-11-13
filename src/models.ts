export type HashMap<T> = {[key : string] : T};

export interface OpenAPI {
  openapi : string;
  info : Info;
  servers ?: Array<Server>;
  paths : Paths;
  components ?: Components;
  security ?: Array<SecurityRequirement>;
  tags ?: Array<Tag>;
  externalDocs ?: ExternalDocumentation;
}

export interface Info {
  title : string;
  description ?: string;
  termsOfService ?: string;
  contact ?: Contact;
  license ?: License;
  version : string;
}

export interface Server {
  url : string;
  description ?: string;
  variables ?: HashMap<ServerVariable>;
}

type Paths = HashMap<Path>;

export interface Components {
  schemas ?: HashMap<Schema | Reference<Schema>>;
  responses ?: HashMap<Response | Reference<Responses>>;
  parameters ?: HashMap<Parameter | Reference<Parameter>>;
  examples ?: HashMap<Example | Reference<Example>>;
  requestBodies ?: HashMap<RequestBody | Reference<RequestBody>>;
  headers ?: HashMap<Header | Reference<Header>>;
  securitySchemes ?: HashMap<SecurityScheme | Reference<SecurityScheme>>;
  links ?: HashMap<Link | Reference<Link>>;
  callbacks ?: HashMap<Callback | Reference<Callback>>;
}

export interface SecurityScheme {
  type : "apiKey" | "http" | "oauth2" | "openIdConnect";
  description ?: string;
  name ?: string;
  in ?: string;
  scheme ?: string;
  bearerFormat ?: string;
  flows ?: OAuthFlows;
  openIdConnectUrl ?: string;
}

export interface ExternalDocumentation {
  description ?: string;
  url : string;
}

export interface Contact {
  name ?: string;
  url ?: string;
  email ?: string;
}

export interface License {
  name : string;
  url ?: string;
}

export interface ServerVariable {
  enum : Array<string>;
  default : string;
  description ?: string;
}

type EnumerableDataType = "integer" | "number" | "string";
type NonEnumerableDataType = "boolean" | "array" | "object";
type DataType = EnumerableDataType | NonEnumerableDataType;

type BaseSchema = {
  required ?: boolean;
};

export type EnumerableSchema = BaseSchema & ({
  type : "integer" | "number";
  enum ?: Array<number>;
  default ?: number;
} |
{
  type : string;
  enum ?: Array<string>
  default ?: string;
});

export type ArraySchema = BaseSchema & {
  type : "array";
  items : Schema;
  default ?: Array<any>;
};

export type ObjectSchema = BaseSchema & {
  type : "object";
  properties : HashMap<Schema>;
  default ?: object;
};

export type NonEnumerableSchema = {
  required ?: boolean;
  type : "boolean";
  default ?: boolean;
} | ArraySchema | ObjectSchema;

export type Schema = EnumerableSchema | NonEnumerableSchema;

export function isEnumerableSchema(schema : Schema) : schema is EnumerableSchema {
  return schema.type === "integer" ||
         schema.type === "number" ||
         schema.type === "string";
}

export function isArraySchema(schema : Schema) : schema is ArraySchema {
  return schema.type === "array";
}

export function isObjectSchema(schema : Schema) : schema is ObjectSchema {
  return schema.type === "object";
}

export interface Response {
  description : string;
  headers ?: HashMap<Header | Reference<Header>>;
  content ?: HashMap<MediaType>;
  links ?: HashMap<Link | Reference<Link>>;
}

export interface Parameter {
  name : string;
  in : "query" | "header" | "path" | "cookie";
  description ?: string;
  required ?: boolean;
  deprecated ?: boolean;
  allowEmptyValue ?: boolean;
  style ?: string;
  explode ?: boolean;
  allowReserved ?: boolean;
  schema ?: Schema | Reference<Schema>;
  example : any;
  examples : HashMap<Example | Reference<Example>>;
  content ?: HashMap<MediaType>;
}

export interface Example {
  summary ?: string;
  description ?: string;
  value ?: any;
  externalValue ?: string;
}

export interface RequestBody {
  description ?: string;
  content : HashMap<MediaType>;
  required ?: boolean;
}

export interface Header {
  description ?: string;
  required ?: boolean;
  deprecated ?: boolean;
  allowEmptyValue ?: boolean;
  style ?: string;
  explode ?: boolean;
  allowReserved ?: boolean;
  schema ?: Parameter | Reference<Schema>;
  example : any;
  examples : HashMap<Example | Reference<Example>>;
  content ?: HashMap<MediaType>;
}

export interface Link {
  operationRef ?: string;
  operationId ?: string;
  parameters ?: HashMap<any>;
  requestBody ?: any;
  description ?: string;
  server ?: Server;
}

export type Callback = HashMap<Path>;

export interface Reference<T> {
  $ref : string;
}

export interface Path {
  $ref ?: string;
  summary ?: string;
  description ?: string;
  get ?: Operation;
  put ?: Operation;
  post ?: Operation;
  delete ?: Operation;
  options ?: Operation;
  head ?: Operation;
  patch ?: Operation;
  trace ?: Operation;
  servers ?: Array<Server>;
  parameters ?: Array<Parameter | Reference<Parameter>>;
}

export interface Operation {
  tags ?: Array<string>;
  summary ?: string;
  description ?: string;
  externalDocs ?: ExternalDocumentation;
  operationId ?: string;
  parameters ?: Array<Parameter | Reference<Parameter>>;
  requestBody ?: RequestBody | Reference<RequestBody>;
  responses : Responses;
  callbacks ?: HashMap<Callback | Reference<Callback>>;
  deprecated ?: boolean;
  security ?: Array<SecurityRequirement>;
  servers ?: Array<Server>;
}

export type SecurityRequirement = HashMap<Array<string>>;

export interface Responses {
  default ?: Response | Reference<Response>;
  "100" ?: Response | Reference<Response>;
  "101" ?: Response | Reference<Response>;
  "102" ?: Response | Reference<Response>;
  "200" ?: Response | Reference<Response>;
  "201" ?: Response | Reference<Response>;
  "202" ?: Response | Reference<Response>;
  "203" ?: Response | Reference<Response>;
  "204" ?: Response | Reference<Response>;
  "205" ?: Response | Reference<Response>;
  "206" ?: Response | Reference<Response>;
  "207" ?: Response | Reference<Response>;
  "208" ?: Response | Reference<Response>;
  "226" ?: Response | Reference<Response>;
  "300" ?: Response | Reference<Response>;
  "301" ?: Response | Reference<Response>;
  "302" ?: Response | Reference<Response>;
  "303" ?: Response | Reference<Response>;
  "304" ?: Response | Reference<Response>;
  "305" ?: Response | Reference<Response>;
  "307" ?: Response | Reference<Response>;
  "308" ?: Response | Reference<Response>;
  "400" ?: Response | Reference<Response>;
  "401" ?: Response | Reference<Response>;
  "402" ?: Response | Reference<Response>;
  "403" ?: Response | Reference<Response>;
  "404" ?: Response | Reference<Response>;
  "405" ?: Response | Reference<Response>;
  "406" ?: Response | Reference<Response>;
  "407" ?: Response | Reference<Response>;
  "408" ?: Response | Reference<Response>;
  "409" ?: Response | Reference<Response>;
  "410" ?: Response | Reference<Response>;
  "411" ?: Response | Reference<Response>;
  "412" ?: Response | Reference<Response>;
  "413" ?: Response | Reference<Response>;
  "414" ?: Response | Reference<Response>;
  "415" ?: Response | Reference<Response>;
  "416" ?: Response | Reference<Response>;
  "417" ?: Response | Reference<Response>;
  "418" ?: Response | Reference<Response>;
  "421" ?: Response | Reference<Response>;
  "422" ?: Response | Reference<Response>;
  "423" ?: Response | Reference<Response>;
  "424" ?: Response | Reference<Response>;
  "426" ?: Response | Reference<Response>;
  "428" ?: Response | Reference<Response>;
  "429" ?: Response | Reference<Response>;
  "431" ?: Response | Reference<Response>;
  "444" ?: Response | Reference<Response>;
  "451" ?: Response | Reference<Response>;
  "499" ?: Response | Reference<Response>;
  "500" ?: Response | Reference<Response>;
  "501" ?: Response | Reference<Response>;
  "502" ?: Response | Reference<Response>;
  "503" ?: Response | Reference<Response>;
  "504" ?: Response | Reference<Response>;
  "505" ?: Response | Reference<Response>;
  "506" ?: Response | Reference<Response>;
  "507" ?: Response | Reference<Response>;
  "508" ?: Response | Reference<Response>;
  "510" ?: Response | Reference<Response>;
  "511" ?: Response | Reference<Response>;
  "599" ?: Response | Reference<Response>;
}

export interface MediaType {
  schema ?: Schema | Reference<Schema>;
  example ?: any;
  examples ?: HashMap<Example | Reference<Example>>;
  encoding ?: HashMap<Encoding>;
}

export interface Encoding {
  contentType ?: string;
  headers ?: HashMap<Header | Reference<Header>>;
  style ?: string;
  explode ?: boolean;
  allowReserved ?: boolean;
}

export interface Tag {
  name : string;
  description ?: string;
  externalDocs ?: ExternalDocumentation;
}

export interface OAuthFlows {
  implicit : OAuthFlow;
  password : OAuthFlow;
  clientCredentials : OAuthFlow;
  authorizationCode : OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl ?: string;
  tokenUrl ?: string;
  refreshUrl ?: string;
  scopes : HashMap<string>;
}

export function isReference(object : any) : object is Reference<any> {
  return "$ref" in object;
}