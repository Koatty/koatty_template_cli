/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2020-12-22 17:51:07
 * @LastEditTime: 2022-03-04 12:14:20
 */
const path = require('path');
const replace = require('replace');
const string = require('../utils/sting');
const log = require('../utils/log');
const ufs = require('../utils/fs');
const { LOGO, CLI_TEMPLATE_URL, CLI_TEMPLATE_NAME } = require('./config');
const template = require('../utils/template');
const { parseProto, parseMethods, parseFields, parseValues } = require('koatty_proto');

const cwd = process.cwd();
let templatePath = '';
// const templatePath = path.dirname(__dirname) + '/template';
/**
 * check app
 * @param  {String}  path []
 * @return {Boolean}             []
 */
const isKoattyApp = function (path) {
    if (ufs.isExist(path + '.koattysrc')) {
        return true;
    }
    return false;
};

/**
 *
 *
 * @returns {*}  
 */
const getAppPath = function () {
    return path.normalize(cwd + '/src/');
}

/**
 * create module
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {Promise<any>}  
 */
module.exports = async function (name, type, opt) {
    log.info('\n Welcome to use Koatty!');
    log.info(LOGO);
    log.info('Start create module...');

    // check is TKoatty project root directory
    if (!isKoattyApp('./')) {
        log.error('Current project is not a Koatty project.');
        log.error(`Please execute "koatty ${type} ${name}Name" after enter Koatty project root directory.`);
        return;
    }
    // template dir
    templatePath = await template.loadAndUpdateTemplate(CLI_TEMPLATE_URL, CLI_TEMPLATE_NAME);
    if (!templatePath) {
        log.error(`Create module fail, can't find template [${CLI_TEMPLATE_URL}], please check network!`);
        return;
    }
    // add prefix
    templatePath = path.resolve(templatePath, "src");

    let args = {};
    try {
        switch (type) {
            case 'controller':
                args = createController(name, type, opt);
                break;
            case 'middleware':
                args = createMiddleware(name, type, opt);
                break;
            case 'model':
                args = createModel(name, type, opt);
                break;
            case 'plugin':
                args = createPlugin(name, type, opt);
                break;
            case 'proto':
                args = createProto(name, type, opt);
                break;
            default:
                args = createDefault(name, type, opt);
                break;
        }

        const { newName, destMap, createMap, replaceMap, callBack } = args;

        const targetDir = [];
        for (const key in destMap) {
            if (Object.hasOwnProperty.call(destMap, key)) {
                const element = destMap[key];
                if (element) {
                    targetDir.push(path.dirname(element));
                    await ufs.copyFile(key, element);
                }
            }
        }
        for (const key in createMap) {
            if (Object.hasOwnProperty.call(createMap, key)) {
                const element = createMap[key];
                if (element) {
                    targetDir.push(path.dirname(key));
                    await ufs.writeFile(key, element);
                }
            }
        }

        for (let key in replaceMap) {
            replace({
                regex: key,
                replacement: replaceMap[key],
                paths: targetDir,
                recursive: true,
                silent: true,
            });
        }

        log.log();
        log.success(`Create module [${newName}] success!`);
        log.log();

        callBack && callBack();
    } catch (error) {
        log.error(`Create module error: ${error.message}`);
        return;
    }
};

/**
 * 路径参数处理
 *
 * @param {*} name
 * @param {*} type
 * @returns {*}  
 */
function parseArgs(name, type) {
    let targetDir = path.resolve(`${getAppPath()}/${type}/`);

    const sourcePath = path.resolve(templatePath, `${type}.template`);
    if (!ufs.isExist(sourcePath)) {
        log.error(`Type ${type} is not supported currently.`);
        return;
    }
    let subModule = '', sourceName = '';
    const subNames = name.split('/');
    if (subNames.length > 1) {
        subModule = subNames[0];
        sourceName = subNames[1];
        targetDir = `${targetDir}/${subModule}`;
    } else {
        sourceName = subNames[0];
    }
    const newName = `${string.toPascal(sourceName)}${string.toPascal(type)}`;
    const destPath = path.resolve(targetDir, `${newName}.ts`);

    // replace map
    const replaceMap = {
        '_SUB_PATH': subModule ? '../..' : '..',
        '_NEW': sourceName,
        '_CLASS_NAME': newName
    };

    //if target file is exist, ignore it
    if (ufs.isExist(destPath)) {
        log.error('Module existed' + ' : ' + destPath);
        return;
    }

    const destMap = {
        [sourcePath]: destPath,
    };
    return { sourceName, sourcePath, newName, subModule, destMap, replaceMap, destPath };
}

/**
 * 处理gRPC控制器
 *
 * @param {*} args
 * @returns {*}  
 */
function parseGrpcArgs(args) {
    // 根据控制器名自动寻找proto文件
    const pascalName = string.toPascal(args.sourceName);
    const protoFile = `${getAppPath()}/proto/${pascalName}.proto`
    if (!ufs.isExist(protoFile)) {
        throw Error(`proto file : ${protoFile} does not exist. Please use the 'koatty proto ${args.sourceName}' command to create.`);
    }
    const source = ufs.readFile(protoFile)
    const res = parseProto(source);
    const methods = parseMethods(res);
    if (!Object.hasOwnProperty.call(methods, pascalName)) {
        throw Error('The proto file does not contain the service' + ' : ' + pascalName);
    }
    const service = methods[pascalName];
    const methodArr = [];
    const importArr = [];
    let methodStr = ufs.readFile(path.resolve(templatePath, `controller_grpc_method.template`));
    let importStr = ufs.readFile(path.resolve(templatePath, `controller_grpc_import.template`));
    Object.keys(service).map(key => {
        if (Object.hasOwnProperty.call(service, key)) {
            const it = service[key];
            if (it) {
                methodStr = methodStr.replace(/_METHOD_NAME/g, it.name);
                let requestType = 'any';
                if (it.requestType != "") {
                    requestType = `${it.requestType}Dto`;
                    importArr.push(importStr.replace(/_DTO_NAME/g, requestType).replace(/_SUB_PATH/g, args.subModule ? '../..' : '..'));
                }

                let responseType = 'any';
                if (it.responseType != 'any') {
                    responseType = `${it.responseType}Dto`;
                    importArr.push(importStr.replace(/_DTO_NAME/g, responseType).replace(/_SUB_PATH/g, args.subModule ? '../..' : '..'));
                }

                methodStr = methodStr.replace(/_REQUEST_TYPE/g, requestType);
                methodStr = methodStr.replace(/_RESPONSE_TYPE/g, responseType);
                methodStr = methodStr.replace(/_RESPONSE_RETURN/g, it.responseType == 'any' ? '{}' : `new ${responseType}();`);
                methodArr.push(methodStr);
            }
        }
    });

    args.createMap = {};
    const ctlContent = ufs.readFile(path.resolve(templatePath, `controller_grpc.template`));
    args.createMap[args.destPath] = ctlContent.replace(/\/\/_METHOD_LIST/g, methodArr.join("\n")).replace(/\/\/_IMPORT_LIST/g, importArr.join("\n"));

    const destPath = path.resolve(`${getAppPath()}/dto/`);
    // enum
    const values = parseValues(res);
    const enumContent = ufs.readFile(path.resolve(templatePath, `enum.template`));
    let enumImports = "";
    Object.keys(values).map(key => {
        if (Object.hasOwnProperty.call(values, key)) {
            const it = values[key];
            if (it) {
                const name = `${destPath}/${it.name}.ts`;
                let props = [...(it.fields || [])];
                enumImports = `${enumImports}import { ${it.name} } from "./${it.name}";\n`;
                args.createMap[name] = enumContent.replace(/_CLASS_NAME/g, it.name).replace(/\/\/_FIELDS/g, props.join("\n\n"));
            }
        }
    });
    // request & reply
    const fields = parseFields(res);
    const dtoContent = ufs.readFile(path.resolve(templatePath, `dto.template`));
    Object.keys(fields).map(key => {
        if (Object.hasOwnProperty.call(fields, key)) {
            const it = fields[key];
            if (it) {
                const name = `${destPath}/${it.name}Dto.ts`;
                let props = [...(it.fields || [])];
                props = props.map(elem => {
                    if (elem != '') {
                        return `    @IsDefined()\n  ${elem}`;
                    }
                    return '';
                });
                args.createMap[name] = dtoContent.replace(/_CLASS_NAME/g, `${it.name}Dto`)
                    .replace(/\/\/_FIELDS/g, props.join("\n\n")
                        .replace(/\/\/_ENUM_IMPORT/g, enumImports));
            }
        }
    });



    return args;

}


/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}  
 */
function createController(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }

    const protocol = opt.type || 'http';
    if (protocol === "grpc") {
        parseGrpcArgs(args);
        args.destMap = {};
        if (args.subModule) {
            args.replaceMap['_NEW'] = `/${string.toPascal(args.subModule)}/${string.toPascal(args.sourceName)}`;
        } else {
            args.replaceMap['_NEW'] = `/${string.toPascal(args.sourceName)}`;
        }

        return args;
    } else if (protocol === "websocket") {
        const sourcePath = path.resolve(templatePath, `controller_ws.template`);
        args.destMap[sourcePath] = args.destMap[args.sourcePath];
        args.destMap[args.sourcePath] = "";
    }

    if (args.subModule) {
        args.replaceMap['_NEW'] = `/${args.subModule}/${args.sourceName}`;
    } else {
        args.replaceMap['_NEW'] = `/${args.sourceName}`;
    }

    return args;
}

/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}  
 */
function createMiddleware(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }
    args.callBack = function () {
        log.log();
        log.log('please modify /app/config/middlewate.ts file:');
        log.log();
        log.log(`list: [..., "${args.newName}"] //加载中间件`);
        log.log('config: { //中间件配置 ');
        log.log(`   "${args.newName}":{ //todo }`);
        log.log('}');

        log.log();
    };
    return args;
}
/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}
 */
function createPlugin(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }
    args.callBack = function () {
        log.log();
        log.log('please modify /app/config/plugin.ts file:');
        log.log();
        log.log(`list: [..., "${args.newName}"] //加载的插件列表,执行顺序按照数组元素顺序`);
        log.log('config: { //插件配置 ');
        log.log(`   "${args.newName}":{ //todo }`);
        log.log('}');

        log.log();
    };
    return args;
}

/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}  
 */
function createModel(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }
    const orm = opt.orm || 'typeorm';
    if (orm === 'typeorm') {
        const sourcePath = path.resolve(templatePath, `model.${orm}.template`);
        args.destMap[sourcePath] = args.destMap[args.sourcePath];
        args.destMap[args.sourcePath] = "";

        const tplPath = path.resolve(templatePath, `plugin.${orm}.template`);
        const newName = `${string.toPascal(orm)}Plugin.ts`
        const destPath = path.resolve(`${getAppPath()}/plugin/${newName}`);
        if (!ufs.isExist(destPath)) {
            args.destMap[tplPath] = path.resolve(`${getAppPath()}/plugin/`, newName);
        }

        args.callBack = function () {
            log.log();
            log.warning('TypeORM used the koatty_typeorm plugin:');
            log.log();
            log.log('https://github.com/Koatty/koatty_typeorm');
            log.log();
            log.log('please modify /app/config/plugin.ts file:');
            log.log();
            log.log(`list: [..., "TypeormPlugin"] //加载的插件列表,执行顺序按照数组元素顺序`);
            log.log('config: { //插件配置 ');
            log.log(`   "TypeormPlugin":{ //todo }`);
            log.log('}');
            log.log();
        };
    }
    if (!ufs.isExist(args.sourcePath)) {
        log.error(`Type ${type} is not supported currently.`);
        process.exit(0);
    }

    return args;
}

/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}  
 */
function createProto(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }
    args.newName = string.toPascal(name);
    args.destMap[args.sourcePath] = path.resolve(`${getAppPath()}/proto/`, `${args.newName}.proto`);
    args.destPath = "";

    args.replaceMap['_CLASS_NAME'] = args.newName;

    args.callBack = function () {
        log.log();
        log.log(`You can use koatty 'controller -t grpc ${name}' to create the controller`);
        log.log();
        log.warning(`Note: the service '${args.newName}' must be included in the ${args.newName}.proto file`);
        log.log();
        log.log();
    };
    return args;
}

/**
 *
 *
 * @param {*} name
 * @param {*} type
 * @param {*} opt
 * @returns {*}  
 */
function createDefault(name, type, opt) {
    const args = parseArgs(name, type);
    if (!args) {
        process.exit(0);
    }
    return args;
}
