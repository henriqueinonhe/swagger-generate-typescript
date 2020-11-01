import { promises as fs, write, writeFile } from "fs";
import { resolve } from "path";
import { Components, HashMap, Info, OpenAPI, Operation, Parameter, Path } from "./models";
import { capitalize, isReference } from "./utils";

interface OperationEntry {
  pathString : string;
  operation : Operation;
}

interface GroupedOperations {
  [tag : string] : {[verb : string] : OperationEntry};
}

async function main() : Promise<void> {
  const buffer = await fs.readFile("specs.json");
  const openApiObject = await JSON.parse(buffer.toString()) as OpenAPI;
  
  await writeApiClients(openApiObject);
  await writeReadme(openApiObject.info);
}

main();

//Extracted Functions
async function writeApiClients(openApiObject : OpenAPI) : Promise<void> {
  const components = openApiObject.components!;
  const baseUrl = openApiObject.servers![0].url;
  if(baseUrl === undefined) {
    throw new Error("Base URL is undefined!");
  }

  const topLevelTags = openApiObject.tags!;
  const paths = openApiObject.paths;
  const groupedOperations = groupOperationsByTag(paths);
  for(const tag in groupedOperations) {
    const operationGroup = groupedOperations[tag]!;
    const topLevelTag = topLevelTags.find(entry => entry.name === tag)!;
    
    let apiClientText = "";
    apiClientText +=            `import axios from "axios";\n`;
    apiClientText +=            `\n`;
    apiClientText +=            `/**\n`;
    apiClientText +=            ` * ${topLevelTag.name}\n`;
    apiClientText +=            ` *\n`;
    if(topLevelTag.description) {
      apiClientText +=          ` * ${topLevelTag.description}\n`;
      apiClientText +=          ` *\n`;
    }
    apiClientText +=            ` */\n`;
    apiClientText +=            `class ${capitalize(tag)}ApiClient {\n`;
    apiClientText +=            `\n`;

    for(const verb in operationGroup) {
      const operationEntry = operationGroup[verb];
      const operation = operationEntry.operation;
      const pathString = operationEntry.pathString;
      const operationId = operation.operationId;
      const url = `${baseUrl}${pathString}`.replace("{", "${");
      if(!operationId) {
        throw new Error(`${tag} -> ${pathString} -> ${verb} - Operation id missing!`);
      }

      apiClientText +=          `/**\n`;
      if(operation.summary) {
        apiClientText +=        ` * ${operation.summary}\n`;
        apiClientText +=        ` *\n`;
      }
      if(operation.description) {
        apiClientText +=        ` * ${operation.description}\n`;
        apiClientText +=        ` *\n`;
      }
      if(operation.deprecated) {
        apiClientText +=        ` * Deprecated\n`;
        apiClientText +=        ` *\n`;
      }
      apiClientText +=          ` */\n`;
      apiClientText +=          `  public static async ${operationId}(${buildApiClientMethodArgumentString(operation, components)}) : Promise<any> { \n`;
      apiClientText +=          `    const response = await axios({\n`;
      apiClientText +=          `      method: "${verb}",\n`;
      apiClientText +=          `      url: \`${url}\`,\n`;
      if(operation.requestBody) {
        apiClientText +=        `      data: body,\n`;
      }
      apiClientText +=          `      params: {\n`;
      if(operation.parameters) {
        apiClientText +=        `        ${buildApiClientMethodParamsString(operation, components)}\n`
      }
      apiClientText +=          `      }\n`;
      apiClientText +=          `    });\n`;
      apiClientText +=          `    return await response.data;\n`;
      apiClientText +=          `  }\n`;
      apiClientText +=          `\n`;
    }

    apiClientText +=            `}\n`;
    await fs.writeFile(`./api/${tag}.ts`, apiClientText);
  }
}

function buildApiClientMethodArgumentString(operation : Operation, components : Components) : string {
  const requiredArguments : Array<string> = [];
  const optionalArguments : Array<string> = [];
  if(operation.requestBody) {
    requiredArguments.push("body : any");
  }

  if(operation.parameters) {
    for(const parameter of operation.parameters) {
      let resolvedParameter : Parameter;
      if(isReference(parameter)) {
        resolvedParameter = resolveReference(components, parameter.$ref) as Parameter;
      }
      else {
        resolvedParameter = parameter;
      }

      const parameterName = resolvedParameter.name;
      const parameterType = resolveType(resolvedParameter.schema.type);
      const required = resolvedParameter.required || false;
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
           .map(parameter => isReference(parameter) ? resolveReference(components, parameter.$ref) as Parameter : parameter)
           .filter(parameter => parameter.in === "query")
           .map(parameter => parameter.name)
           .join(",\n        ");
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

async function writeModels(openApiObject : OpenAPI) : Promise<void> {
  
}

function groupOperationsByTag(paths : HashMap<Path>) : GroupedOperations {
  const verbs = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
  const groupedOperations : GroupedOperations = {};
  for(const pathString in paths) {
    const path = paths[pathString];

    for(const verb of verbs) {
      const operation = (path as {[key : string] : Operation})[verb] as Operation;
      const operationIsDefined = operation !== undefined;
      if(operationIsDefined) {
        const tags = operation.tags!;

        for(const tag of tags) {
          //Create a tag bucket if one doesn't exist already
          if(!groupedOperations[tag]){
            groupedOperations[tag] = {};
          }

          groupedOperations[tag][verb] = {
            operation,
            pathString
          };
        }
      }
    }
  }

  return groupedOperations;
}

function resolveReference(components : Components, refPath : string) : unknown {
  const breadcrumbs = refPath.split("/").slice(2);
  
  let currentObject : any = components;
  for(const breadcrumb of breadcrumbs) {
    currentObject = currentObject[breadcrumb];
  }
  return currentObject;
}

function resolveType(type : string) : string {
  if(type === "integer") {
    return "number";
  }

  return type;
}