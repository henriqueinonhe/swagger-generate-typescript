import { promises as fs } from "fs";
import { HashMap, Info, OpenAPI, Operation, Parameter, Path } from "./models";

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
  
  //Extracting Base Url
  const baseUrl = openApiObject.servers![0].url;
  if(baseUrl === undefined) {
    throw new Error("Base URL is undefined!");
  }

  const topLevelTags = openApiObject.tags;
  const paths = openApiObject.paths;
  const groupedOperations = groupOperationsByTag(paths);
  const promises = [];
  for(const tag in groupedOperations) {
    const operationGroup = groupedOperations[tag];
    const correspondingTopLevelTag = topLevelTags?.find(topLevelTag => topLevelTag.name === tag);

    let methodsString = "";
    for(const verb in operationGroup) {
      const operationEntry = operationGroup[verb];
      const operation = operationEntry.operation;
      const operationId = operation.operationId; //Check whether it is defined
      if(!operationId) {
        throw new Error("Operation id is not defined!");
      }

      let queryParams = [];
      let methodArguments = [];
      if(operation.parameters) {
        methodArguments.push(...operation.parameters.map(parameter => `${(parameter as Parameter).name} : ${(parameter as Parameter).schema?.type}`));
        
        queryParams.push(...operation.parameters.filter(parameter => (parameter as Parameter).in === "query").map(parameter => `${(parameter as Parameter).name}`));
      }
      
      if(operation.requestBody) {
        methodArguments.push("requestBody : any");
      }
      
      const methodArgumentsString = methodArguments.join(", ");
      const pathString = operationEntry.pathString;
      const url = `${baseUrl}${pathString.replace(/\{/, "${")}`;
      const data = `${operation.requestBody ? "requestBody" : "undefined"}`;
      const queryParamsString = queryParams.length !== 0 ? `{\n        ${queryParams.join(`,\n        `)}\n      }` : "undefined";
      methodsString +=
` /**
   * ${operation.summary}
   * 
   * ${operation.description} 
   */
  public static async ${operationId}(${methodArgumentsString}) : Promise<any> {
    const response = await axios({
      method: "${verb}",
      url: \`${url}\`,
      data: ${data},
      params: ${queryParamsString}
    });
    return await response.data;
  }

`
    }

    const fileString =

`import axios from "axios";

/**
 * ${correspondingTopLevelTag?.name}
 * 
 * ${correspondingTopLevelTag?.description}
 */
export class ${tag} {

  ${methodsString}
}
    
`
    const promise = fs.writeFile(`./api/${tag}.ts`, fileString);
    promises.push(promise);
  }  

  await Promise.all(promises);
  await writeReadme(openApiObject.info);
}

main();

//Extracted Functions
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