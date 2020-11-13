import { promises as fs } from "fs";
import { stringify } from "querystring";
import { Components, HashMap, Info, OpenAPI, Operation, Parameter, Path, Reference, RequestBody, Schema, Tag, isReference, isArraySchema, isEnumerableSchema, isObjectSchema, Responses, Response } from "./models";
import { capitalize } from "./utils";

interface OperationEntry {
  pathString : string;
  operation : Operation;
}

interface OperationGroup {
  [verb : string] : OperationEntry;
}

interface OperationGroupTable {
  [tag : string] : OperationGroup;
}

async function main() : Promise<void> {
  const buffer = await fs.readFile("specs.json");
  const openApiObject = await JSON.parse(buffer.toString()) as OpenAPI;
  
  await writeApiClients(openApiObject);
  await writeReadme(openApiObject.info);
  // await writeModels(openApiObject);
}

main();

//Extracted Functions
async function writeApiClients(openApiObject : OpenAPI) : Promise<void> {
  const components = openApiObject.components!;
  const baseUrl = openApiObject.servers![0].url;
  
  if(baseUrl === undefined) {
    throw new Error("Base URL is undefined!");
  }

  const paths = openApiObject.paths;
  const operationGroupTable = groupOperationsByTag(paths);

  for(const tag in operationGroupTable) {
    const tagObject = openApiObject.tags!.find(tagObject => tagObject.name === tag)!;
    const clientName = tagObject.name;
    const clientDescription = tagObject.description;
    const operationGroup = operationGroupTable[tag]!;
    writeSingleApiClient(clientName, clientDescription, tag, operationGroup, baseUrl, components);
  }
}

async function writeSingleApiClient(name : string, description : string | undefined, tag : string, operationGroup : OperationGroup, baseUrl : string, components : Components) : Promise<void> {
    let apiClientText = "";
    apiClientText +=            `import axios from "axios";\n`;
    apiClientText +=            `\n`;
    apiClientText +=            `/**\n`;
    apiClientText +=            ` * ${name}\n`;
    apiClientText +=            ` *\n`;
    if(description) {
      apiClientText +=          ` * ${description}\n`;
      apiClientText +=          ` *\n`;
    }
    apiClientText +=            ` */\n`;
    apiClientText +=            `export class ${capitalize(tag)}ApiClient {\n`;
    apiClientText +=            `\n`;
    apiClientText +=            `${buildApiClientClassBodyString(operationGroup, baseUrl, tag, components)}`
    apiClientText +=            `}\n`;
    await fs.writeFile(`./api/${tag}.ts`, apiClientText);
}

function buildApiClientClassBodyString(operationGroup : OperationGroup, baseUrl : string, tag : string, components : Components) : string {
  let classBodyText = "";
  for(const verb in operationGroup) {
    const operationEntry = operationGroup[verb];
    const operation = operationEntry.operation;
    const pathString = operationEntry.pathString;
    const url = `${baseUrl}${pathString}`.replace("{", "${");

    classBodyText += buildApiClientMethodString(operation, verb, url, components);
  }
  return classBodyText;
}

function buildApiClientMethodString(operation : Operation, verb : string, url : string, components : Components) : string {
  const {
    operationId,
    summary,
    description,
    deprecated = false,
    requestBody,
    parameters,
    responses
  } = operation;

  if(!operationId) {
    throw new Error(`${url} -> ${verb} - Operation id missing!`);
  }

  let methodText = "";
  methodText +=          `/**\n`;
  if(summary) {
    methodText +=        ` * ${summary}\n`;
    methodText +=        ` *\n`;
  }
  if(description) {
    methodText +=        ` * ${description}\n`;
    methodText +=        ` *\n`;
  }
  if(deprecated) {
    methodText +=        ` * Deprecated\n`;
    methodText +=        ` *\n`;
  }
  methodText +=          ` */\n`;
  methodText +=          `  public static async ${operationId}(${buildApiClientMethodArgumentString(operation, components)}) : Promise<${buildApiClientMethodReturnTypeString(responses, components)}> { \n`;
  methodText +=          `    const response = await axios({\n`;
  methodText +=          `      method: "${verb}",\n`;
  methodText +=          `      url: \`${url}\`,\n`;
  if(requestBody) {
    methodText +=        `      data: body,\n`;
  }
  methodText +=          `      params: {\n`;
  if(parameters) {
    methodText +=        `        ${buildApiClientMethodParamsString(operation, components)}\n`
  }
  methodText +=          `      }\n`;
  methodText +=          `    });\n`;
  methodText +=          `    return await response.data;\n`;
  methodText +=          `  }\n`;
  methodText +=          `\n`;

  return methodText;
}

function buildApiClientMethodArgumentString(operation : Operation, components : Components) : string {
  const {
    requestBody,
    parameters
  } = operation;

  const requiredArguments : Array<string> = [];
  const optionalArguments : Array<string> = [];

  if(requestBody) {
    const resolvedRequestBody = resolve(components, requestBody);
    const required = resolvedRequestBody.required || false;
    const schema = resolvedRequestBody.content["application/json"].schema; //Hard coded but might change in the future
    const resolvedSchema = resolve(components, schema) as Schema;

    if(required) {
      requiredArguments.push(`body : ${resolveType(resolvedSchema)}`);
    }
    else {
      optionalArguments.push(`body ?: ${resolveType(resolvedSchema)}`);
    }
  }

  if(parameters) {
    for(const parameter of parameters) {
      const resolvedParameter = resolve(components, parameter);
      const parameterName = resolvedParameter.name;
      const resolvedSchema = resolve(components, resolvedParameter.schema) as Schema;
      const parameterType = resolveType(resolvedSchema);
      const parameterIn = resolvedParameter.in;
      const required = parameterIn === "path" ? true : (resolvedParameter.required || false);
      if(required) {
        requiredArguments.push(`${parameterName} : ${parameterType}`);
      }
      else {
        optionalArguments.push(`${parameterName} ?: ${parameterType}`);
      }
    }
  }


  return [...requiredArguments, ...optionalArguments].join(", ");
}

function buildApiClientMethodParamsString(operation : Operation, components : Components) : string {
  return operation.parameters!
           .map(parameter => isReference(parameter) ? resolveReferenceExplicitely(components, parameter) as Parameter : parameter)
           .filter(parameter => parameter.in === "query")
           .map(parameter => parameter.name)
           .join(",\n        ");
}

function buildApiClientMethodReturnTypeString(responses : Responses | Reference<Responses>, components : Components) : string {
  const actualResponses = resolve(components, responses);
  const schemas : Array<Schema | Reference<Schema>> = [];
  for(const httpResponse in actualResponses) {
    const response = (actualResponses as Record<string, Response | Reference<Response>>)[httpResponse];
    const actualResponse = resolve(components, response);
    const schema = actualResponse.content!["application/json"].schema;
    const actualSchema = resolve(components, schema)!;
    schemas.push(actualSchema);
  }

  return schemas.map(schema => resolveType(schema as Schema)).join(" | ");
}

async function writeReadme(info : Info) : Promise<void> {
  const title = info.title;
  const description = info.description;
  const termsOfService = info.termsOfService;
  const license = info.license;
  const version = info.version;
  const contact = info.contact;

  let readmeText = "";
  readmeText +=           `# ${title}\n`;
  readmeText +=           `\n`;
  readmeText +=           `${description}\n`;
  readmeText +=           `\n`;
  readmeText +=           `Version: ${version}\n`;
  if(termsOfService) {
    readmeText +=         `[Terms of service](${termsOfService})\n`;
    readmeText +=         `\n`;
  }
  if(license) {
    readmeText +=         `## License\n`;
    readmeText +=         `\n`;
    if(license.url) {
      readmeText +=       `[${license.name}](${license.url})`;
    }
    else {
      readmeText +=       `${license.name}`;
    }
    readmeText +=         `\n`;
  }
  if(contact) {
    readmeText +=         `## Contact\n`;
    readmeText +=         `\n`;
    if(contact.name) {
      readmeText +=       `Name: ${contact.name}\n`;
      readmeText +=       `\n`;
    }
    if(contact.email) {
      readmeText +=       `Email: ${contact.email}\n`;
      readmeText +=       `\n`;
    }
    if(contact.url) {
      readmeText +=       `Website: ${contact.url}\n`
      readmeText +=       `\n`;
    }
  }
  
  await fs.writeFile("./api/README.md", readmeText);
}

// async function writeModels(openApiObject : OpenAPI) : Promise<void> {
//   const components = openApiObject.components;

//   let modelsText = "";
//   if(components) {
//     if(components.schemas) {
//       for(const key in components.schemas) {
//         const schema = components.schemas[key]!;
//         const resolvedSchema = isReference(schema) ? resolveReference(components, schema.$ref) : schema;

//         if(resolvedSchema.type === "object") {
//           modelsText +=        `export interface ${capitalize(key)}Schema {\n`;
//           modelsText +=        `${resolveInterface(schema)}`;
//           modelsText +=        `}\n`;
//           modelsText +=        `\n`;
//         }
//       }
//     }
//   }

//   await fs.writeFile("./api/models.ts", modelsText);
// }

function groupOperationsByTag(paths : HashMap<Path>) : OperationGroupTable {
  const verbs = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
  const operationGroupTable : OperationGroupTable = {};
  for(const pathString in paths) {
    const path = paths[pathString];

    for(const verb of verbs) {
      const operation = (path as {[key : string] : Operation})[verb] as Operation;
      const operationIsDefined = operation !== undefined;
      if(operationIsDefined) {
        const tags = operation.tags!;

        for(const tag of tags) {
          //Create a tag bucket if one doesn't exist already
          if(!operationGroupTable[tag]){
            operationGroupTable[tag] = {};
          }

          operationGroupTable[tag][verb] = {
            operation,
            pathString
          };
        }
      }
    }
  }

  return operationGroupTable;
}

function resolveReferenceExplicitely<T>(components : Components, reference : Reference<T>) : T {
  const refPath = reference.$ref;
  const breadcrumbs = refPath.split("/").slice(2);
  
  let currentObject : any = components;
  for(const breadcrumb of breadcrumbs) {
    currentObject = currentObject[breadcrumb];
  }
  return currentObject;
}

function resolveType(schema : Schema) : string {
  const { type } = schema;
  
  if(isEnumerableSchema(schema)) { //integer, number and string types
    const enumeration = schema.enum;
    if(enumeration) {
      return enumeration.join(" | ");
    }
    
    if(type === "integer") {
      return "number";
    }

    return type;
  }

  if(isArraySchema(schema)) {
    const itemsSchema = schema.items;
    return `Array<${resolveType(itemsSchema)}>`;    
  }

  if(isObjectSchema(schema)) {
    let typeString = `{ `;

    const properties = schema.properties;
    for(const key in properties) {
      const property = properties[key];
      typeString += `${key} : ${resolveType(property)}; `;
    }
    typeString += ` }`;
    return typeString;
  }

  return "boolean";
}

// function resolveInterface(schema : Schema) : string {
//   let interfaceText = "";
//   const properties = schema.properties;
//   for(const key in properties) {
//     const property = properties[key];
//     interfaceText += `  ${key} : ${resolveType(property.type)};\n`;
//   }

//   return interfaceText;
// }

function resolve<T>(components : Components, object : T | Reference<T>) : T {
  if(isReference(object)) {
    return resolveReferenceExplicitely(components, object);
  }

  return object;
}