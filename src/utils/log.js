/*
 * @Description:
 * @Usage:
 * @Author: richen
 * @Date: 2020-12-22 17:33:14
 * @LastEditTime: 2020-12-22 17:33:14
 */
const chalk = require('chalk');

module.exports = {
    log(args) {
        if (args === undefined) {
            console.log(chalk.blue(''));
            return;
        }
        const msg = typeof args === 'string' ? args : JSON.stringify(args);
        console.log(chalk.blue(msg));
    },
    info(args) {
        if (args === undefined) {
            console.log(chalk.blue(''));
            return;
        }
        const msg = typeof args === 'string' ? args : JSON.stringify(args);
        console.log(chalk.blue(msg));
    },
    success(args) {
        if (args === undefined) {
            console.log(chalk.green(''));
            return;
        }
        const msg = typeof args === 'string' ? args : JSON.stringify(args);
        console.log(chalk.green(msg));
    },
    warning(args) {
        if (args === undefined) {
            console.log(chalk.yellow(''));
            return;
        }
        const msg = typeof args === 'string' ? args : JSON.stringify(args);
        console.log(chalk.yellow(msg));
    },
    error(args) {
        if (args === undefined) {
            console.log(chalk.red(''));
            return;
        }
        const msg = typeof args === 'string' ? args : JSON.stringify(args);
        console.log(chalk.red(msg));
    },
};
