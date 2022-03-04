#!/usr/bin/env node

const program = require('commander');
const updateNotifier = require('update-notifier');
const pkg = require('../package.json');
const create_project = require('./command/create_project');
const create_module = require('./command/create_module');

updateNotifier({ pkg }).notify();

const camelias = str => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
const cleanArgs = (cmd) => {
    const args = {};
    cmd.options.forEach((o) => {
        const key = camelias(o.long.replace(/^--/, ''));
        // if an option is not present and Command has a method with the same name
        // it should not be copied
        if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
            args[key] = cmd[key];
        }
    });
    return args;
};

program.version(pkg.version).usage('[command] <options ...>');


// create project
program
    .command('new <projectName>')
    .description('create project')
    .option('-t, --template <template>', 'create project use custom template: project|middleware|plugin')
    .action((projectName, cmdObj) => {
        create_project(projectName, cleanArgs(cmdObj));
    });

// create controller
program
    .command('controller <controllerName>')
    .description('create controller class')
    .option('-t, --type <type>', 'create controller\'s type, http|grpc|websocket, default is http controller.')
    .action((controllerName, cmdObj) => {
        create_module(controllerName, 'controller', cleanArgs(cmdObj));
    });

// create middleware
program
    .command('middleware <middlewareName>')
    .description('create middleware class')
    .action((middlewareName) => {
        create_module(middlewareName, 'middleware');
    });


// create service
program
    .command('service <serviceName>')
    .description('create service class')
    .action((serviceName) => {
        create_module(serviceName, 'service');
    });

// create plugin
program
    .command('plugin <pluginName>')
    .description('create plugin class')
    .action((pluginName) => {
        create_module(pluginName, 'plugin');
    });


// create aspect
program
    .command('aspect <aspectName>')
    .description('create aspect class')
    .action((aspectName) => {
        create_module(aspectName, 'aspect');
    });

// create dto class
program
    .command('dto <dtoName>')
    .description('create dto class')
    .action((dtoName) => {
        create_module(dtoName, 'dto');
    });

// create protobuf file
program
    .command('proto <protoName>')
    .description('create proto file')
    .action((protoName) => {
        create_module(protoName, 'proto');
    });


// create model
program
    .command('model <modelName>')
    .description('create model class')
    .option('-o, --orm <orm>', 'used orm module (thinkorm, typeorm), default is typeorm')
    .action((modelName, cmdObj) => {
        create_module(modelName, 'model', cleanArgs(cmdObj));
    });




program.parse(process.argv);