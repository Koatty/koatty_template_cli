/*
 * @Author: richen
 * @Date: 2020-12-08 10:48:45
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-03-04 17:44:34
 * @License: BSD (3-Clause)
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const del = require('del');
const cpy = require('ncp').ncp;
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const log = require('./log');
const loading = require('./loading');
const { isExist } = require('./fs');

// os temp dir
const osTempDir = os.tmpdir();

/**
 * pull template from remote repository
 * @param {string} url git repository address
 * @param {string} dir repository save path
 * @returns {promise}
 */
const pullTemplate = (url, ref, dir) => git.fastForward({
    fs, http, url, dir, ref,
    gitdir: path.join(dir, '.git'),
    singleBranch: true,
});

/**
 * clone template from remote repository
 * @param {string} url git repository address
 * @param {string} ref git repository branch
 * @param {string} dir repository save path
 * @returns {promise}
 */
const cloneTemplate = (url, ref, dir) => git.clone({
    fs, http, url, dir, ref,
    singleBranch: true,
});

/**
 * copy template directory
 * @param {string} templatePath template path
 * @param {string} destPath destination path
 * @returns {promise}
 */
// @ts-ignore
const copyTemplate = (templatePath, destPath) => new Promise((resolve, reject) =>
    cpy(templatePath, destPath, (err) => {
        if (err) reject(err);
        resolve();
    }));

/**
 * load remote template and update local template
 * @param {string} templateUrl template git address
 * @param {string} templateName template name
 * @param {string} [templateDir] template directory
 * @returns {Promise<any>} local template path
 */
const loadAndUpdateTemplate = async (templateUrl, templateName, templateDir = "") => {
    if (templateDir == "") {
        templateDir = path.join(osTempDir, templateName);
    }

    let branchName = "main";
    if (templateUrl.includes("#")) {
        const urlArr = templateUrl.split('#');
        if (urlArr.length == 2) {
            templateUrl = urlArr[0] || "";
            branchName = urlArr[1] || "main";
        }
    }

    // download template
    log.log(`Start download template [${templateName}]`);
    try {
        loading.start();
        // check local template
        if (isExist(templateDir)) {
            // update local template
            // execSync(`rm -rf ${templateDir}`);
            // execSync(`mv ${newTemplateDir} ${templateDir}`);
            if (!isExist(path.join(templateDir, '.git'))) {
                await del(templateDir, { force: true });
            } else {
                await pullTemplate(templateUrl, branchName, templateDir).then(() => {
                    log.info(`Update template [${templateName}] success!`);
                }).catch(err => {
                    log.error(`Update template [${templateName}] fail: ${err.stack}`);
                });
                return templateDir;
            }
        }

        // clone template
        await cloneTemplate(templateUrl, branchName, templateDir);
        log.info(`Download template [${templateName}] success!`);
        return templateDir;
    } catch (error) {
        log.error(`Download template [${templateName}] fail: ${error.stack}`);
    } finally {
        loading.stop();
    }
};

module.exports = {
    pullTemplate,
    copyTemplate,
    loadAndUpdateTemplate,
};