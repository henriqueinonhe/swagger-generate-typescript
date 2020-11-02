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
  schemas ?: HashMap<Schema | Reference>;
  responses ?: HashMap<Response | Reference>;
  parameters ?: HashMap<Parameter | Reference>;
  examples ?: HashMap<Example | Reference>;
  requestBodies ?: HashMap<RequestBody | Reference>;
  headers ?: HashMap<Header | Reference>;
  securitySchemes ?: HashMap<SecurityScheme | Reference>;
  links ?: HashMap<Link | Reference>;
  callbacks ?: HashMap<Callback | Reference>;
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

// export interface Schema {
//   // Not happy with this
// }

export type Schema = any;

export interface Response {
  description : string;
  headers ?: HashMap<Header | Reference>;
  content ?: HashMap<MediaType>;
  links ?: HashMap<Link | Reference>;
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
  schema ?: Schema | Reference;
  example : any;
  examples : HashMap<Example | Reference>;
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
  schema ?: Parameter | Reference;
  example : any;
  examples : HashMap<Example | Reference>;
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

export interface Reference {
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
  parameters ?: Array<Parameter | Reference>;
}

export interface Operation {
  tags ?: Array<string>;
  summary ?: string;
  description ?: string;
  externalDocs ?: ExternalDocumentation;
  operationId ?: string;
  parameters ?: Array<Parameter | Reference>;
  requestBody ?: RequestBody | Reference;
  responses : Responses;
  callbacks ?: HashMap<Callback | Reference>;
  deprecated ?: boolean;
  security ?: Array<SecurityRequirement>;
  servers ?: Array<Server>;
}

export type SecurityRequirement = HashMap<Array<string>>;

export interface Responses {
  default ?: Response | Reference;
  "100" : Response | Reference;
  "101" : Response | Reference;
  "102" : Response | Reference;
  "200" : Response | Reference;
  "201" : Response | Reference;
  "202" : Response | Reference;
  "203" : Response | Reference;
  "204" : Response | Reference;
  "205" : Response | Reference;
  "206" : Response | Reference;
  "207" : Response | Reference;
  "208" : Response | Reference;
  "226" : Response | Reference;
  "300" : Response | Reference;
  "301" : Response | Reference;
  "302" : Response | Reference;
  "303" : Response | Reference;
  "304" : Response | Reference;
  "305" : Response | Reference;
  "307" : Response | Reference;
  "308" : Response | Reference;
  "400" : Response | Reference;
  "401" : Response | Reference;
  "402" : Response | Reference;
  "403" : Response | Reference;
  "404" : Response | Reference;
  "405" : Response | Reference;
  "406" : Response | Reference;
  "407" : Response | Reference;
  "408" : Response | Reference;
  "409" : Response | Reference;
  "410" : Response | Reference;
  "411" : Response | Reference;
  "412" : Response | Reference;
  "413" : Response | Reference;
  "414" : Response | Reference;
  "415" : Response | Reference;
  "416" : Response | Reference;
  "417" : Response | Reference;
  "418" : Response | Reference;
  "421" : Response | Reference;
  "422" : Response | Reference;
  "423" : Response | Reference;
  "424" : Response | Reference;
  "426" : Response | Reference;
  "428" : Response | Reference;
  "429" : Response | Reference;
  "431" : Response | Reference;
  "444" : Response | Reference;
  "451" : Response | Reference;
  "499" : Response | Reference;
  "500" : Response | Reference;
  "501" : Response | Reference;
  "502" : Response | Reference;
  "503" : Response | Reference;
  "504" : Response | Reference;
  "505" : Response | Reference;
  "506" : Response | Reference;
  "507" : Response | Reference;
  "508" : Response | Reference;
  "510" : Response | Reference;
  "511" : Response | Reference;
  "599" : Response | Reference;
}

export interface MediaType {
  schema ?: Schema | Reference;
  example ?: any;
  examples ?: HashMap<Example | Reference>;
  encoding ?: HashMap<Encoding>;
}

export interface Encoding {
  contentType ?: string;
  headers ?: HashMap<Header | Reference>;
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